import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  mockHealthRecords, 
  mockMeasurements, 
  mockPhysicalTests, 
  mockInjuries,
  mockConfig 
} from '@/data/mockData'

export const useHealthStore = defineStore('health', () => {
  const healthRecords = ref([...mockHealthRecords.map(r => ({ ...r }))])
  const measurements = ref([...mockMeasurements.map(m => ({ ...m }))])
  const physicalTests = ref([...mockPhysicalTests.map(t => ({ ...t }))])
  const injuries = ref([...mockInjuries.map(i => ({ ...i }))])
  const configSalud = ref({ ...mockConfig.salud })

  // --- Getters ---
  const getHealthByUserId = computed(() => (userId) => {
    return healthRecords.value.find(r => r.userId === userId) || null
  })

  const getMeasurementsByUserId = computed(() => (userId) => {
    return measurements.value
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  const getLatestMeasurement = computed(() => (userId) => {
    const userMeasures = getMeasurementsByUserId.value(userId)
    return userMeasures.length > 0 ? userMeasures[userMeasures.length - 1] : null
  })

  const getPhysicalTestsByUserId = computed(() => (userId) => {
    return physicalTests.value
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  })

  const getLatestPhysicalTest = computed(() => (userId) => {
    const tests = getPhysicalTestsByUserId.value(userId)
    return tests.length > 0 ? tests[tests.length - 1] : null
  })

  const getInjuriesByUserId = computed(() => (userId) => {
    return injuries.value.filter(i => i.userId === userId)
  })

  const getActiveInjuriesByUserId = computed(() => (userId) => {
    return injuries.value.filter(i => i.userId === userId && i.recoveryStatus === 'En Rehabilitación')
  })

  // --- Actions ---
  function addMeasurement(measurement) {
    const newId = Math.max(...measurements.value.map(m => m.id), 0) + 1
    measurements.value.push({ ...measurement, id: newId })
  }

  function addPhysicalTest(test) {
    const newId = Math.max(...physicalTests.value.map(t => t.id), 0) + 1
    physicalTests.value.push({ ...test, id: newId })
  }

  function updateInjuryStatus(injuryId, status) {
    const idx = injuries.value.findIndex(i => i.id === injuryId)
    if (idx !== -1) {
      injuries.value[idx].recoveryStatus = status
    }
  }

  function saveMedicalRecord(userId, data) {
    const idx = healthRecords.value.findIndex(r => r.userId === userId)
    if (idx !== -1) {
      healthRecords.value[idx] = { ...healthRecords.value[idx], ...data }
    } else {
      healthRecords.value.push({ userId, ...data })
    }
  }

  return {
    healthRecords, measurements, physicalTests, injuries, configSalud,
    getHealthByUserId, getMeasurementsByUserId, getLatestMeasurement,
    getPhysicalTestsByUserId, getLatestPhysicalTest, getInjuriesByUserId, getActiveInjuriesByUserId,
    addMeasurement, addPhysicalTest, updateInjuryStatus, saveMedicalRecord
  }
})
