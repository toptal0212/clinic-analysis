export interface ClinicConfig {
  id: string
  name: string
  clientId: string
  clientSecret: string
}

export const CLINIC_CONFIGS: ClinicConfig[] = [
  {
    id: 'yokohama',
    name: '横浜院',
    clientId: '56ensn75gfosp2d40jp9vk6h8j',
    clientSecret: '1npprack1mkd80ilvi1rcjsdqjvcv10qbr2qgeq463cv6rdqkh78'
  },
  {
    id: 'koriyama',
    name: '郡山院',
    clientId: '5akls28bqmv28e2buaujbaaa4t',
    clientSecret: '18b6qdklg7gktn9rd31ru5q4gb4svhitkvfi714k81ai3ksip0vl'
  },
  {
    id: 'mito',
    name: '水戸院',
    clientId: '5t4crevvhpl55ko383c0jumnpb',
    clientSecret: '1ubu2qqujd4eqakat85iu4h97k8ogu6orut6s08kgr98f9cuk4gb'
  },
  {
    id: 'omiya',
    name: '大宮院',
    clientId: '74kgoefn8h2pbslk8qo50j99to',
    clientSecret: '1r19ivhqj4tsmqbs75m03vm6fk9iedk63n52b0n7og77lt9d56g0'
  }
]

export const getClinicById = (id: string): ClinicConfig | undefined => {
  return CLINIC_CONFIGS.find(clinic => clinic.id === id)
}

export const getDefaultClinic = (): ClinicConfig => {
  return CLINIC_CONFIGS[0] // Default to 横浜院
}
