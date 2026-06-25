import { mapComponentToCategory } from '../mocks';

const LOGIC_LEVEL_SENSITIVE = /bmp280|bme280|mpu6050|mpu9250|vl53|ccs811|si7021|tcs34725|3\.3v|3v3/i;
const FIVE_VOLT_LOGIC = /arduino uno|arduino nano|atmega|5v logic|hc-sr04/i;

export function parseVoltageValue(voltageStr) {
  if (!voltageStr || voltageStr === '—') return null;
  const match = String(voltageStr).match(/(\d+(?:\.\d+)?)\s*v/i);
  return match ? parseFloat(match[1]) : null;
}

export function inferVoltageFromComponent(name, explicitVoltage) {
  const parsed = parseVoltageValue(explicitVoltage);
  if (parsed !== null) return parsed;

  const lower = String(name).toLowerCase();
  if (/esp32|esp8266|c3|s2|wroom|nodemcu/.test(lower)) return 3.3;
  if (LOGIC_LEVEL_SENSITIVE.test(lower)) return 3.3;
  if (/11\.1|lipo 3s|12v battery/.test(lower)) return 11.1;
  if (/7\.4|2s lipo/.test(lower)) return 7.4;
  if (FIVE_VOLT_LOGIC.test(lower)) return 5;
  if (/arduino|servo|relay module|5v/.test(lower)) return 5;
  return null;
}

export function componentsToBuildSlots(components) {
  const slots = {};
  const categoryCounts = {};

  components.forEach((comp, index) => {
    const category = mapComponentToCategory(comp.name);
    const count = categoryCounts[category] || 0;
    categoryCounts[category] = count + 1;
    const slotKey = count === 0 ? category : `${category}-${count}`;

    slots[slotKey] = {
      partId: `ingested-${index}-${comp.name}`,
      name: comp.name,
      voltage: comp.voltage || inferVoltageLabel(comp.name, comp.voltage),
      price: comp.price || estimatePlaceholderPrice(comp.name),
      specs: `Qty ${comp.quantity || 1} · Ingested from scan`,
      category,
    };
  });

  return slots;
}

function inferVoltageLabel(name, explicit) {
  const v = inferVoltageFromComponent(name, explicit);
  if (v === null) return '—';
  return `${v}V`;
}

function estimatePlaceholderPrice(name) {
  const lower = name.toLowerCase();
  if (/arduino|esp32|mcu|microcontroller/.test(lower)) return 850;
  if (/motor|servo|driver|l298/.test(lower)) return 320;
  if (/sensor|ultrasonic|bmp|dht/.test(lower)) return 150;
  if (/battery|lipo|power/.test(lower)) return 650;
  if (/wire|breadboard|resistor/.test(lower)) return 85;
  return 120;
}

export function detectVoltageConflict(buildSlots) {
  const entries = Object.entries(buildSlots).map(([slotId, slot]) => ({
    slotId,
    ...slot,
    logicVoltage: inferVoltageFromComponent(slot.name, slot.voltage),
  }));

  const fiveVDevices = entries.filter(
    (e) => e.logicVoltage === 5 || FIVE_VOLT_LOGIC.test(e.name)
  );
  const threeThreeOnly = entries.filter(
    (e) =>
      e.logicVoltage === 3.3 ||
      (LOGIC_LEVEL_SENSITIVE.test(e.name) && e.logicVoltage !== 5)
  );

  if (fiveVDevices.length === 0 || threeThreeOnly.length === 0) {
    return null;
  }

  const mcu = fiveVDevices[0];
  const sensor = threeThreeOnly[0];

  return {
    id: 'conflict-i2c-voltage',
    severity: 'critical',
    type: 'voltage_mismatch',
    message: `${sensor.name} (${sensor.voltage}) on ${mcu.name} bus (${mcu.voltage} logic)`,
    affectedSlots: [mcu.slotId, sensor.slotId],
    physicsExplanation:
      'I²C/SPI on 5V microcontrollers expose 5V logic levels. 3.3V-only sensors exceed absolute maximum input ratings when tied directly. Use a bidirectional logic level shifter between domains.',
    alternative: {
      partId: 'logic-shifter',
      name: '4-Channel Logic Level Shifter',
      price: 95,
      voltage: '3.3V ↔ 5V',
      specs: 'Bidirectional · 4 channels',
      resolvesConflict: true,
      insertSlot: sensor.slotId,
    },
  };
}

export function getSlotCategories(buildSlots) {
  const seen = new Set();
  return Object.entries(buildSlots).map(([slotId, slot]) => {
    const category = slot.category || slotId.split('-')[0];
    return { slotId, category, label: formatCategoryLabel(category, seen) };
  });
}

function formatCategoryLabel(category, seen) {
  const base = category.charAt(0).toUpperCase() + category.slice(1);
  if (!seen.has(category)) {
    seen.add(category);
    return base;
  }
  return `${base} (alt)`;
}

export function slotsToComponentList(buildSlots) {
  return Object.values(buildSlots).map((slot) => ({
    name: slot.name,
    quantity: 1,
    voltage: slot.voltage,
    price: slot.price,
  }));
}
