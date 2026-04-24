/**
 * @file licenseService.js
 * @description Archivo del sistema licenseService.js.
 * @module Module
 * @path /backend/src/services/licenseService.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

// Port of PHP Utilitario_Encriptar and generar_licencia logic

function utilitarioEncriptar(text, key) {
  const pad = '00'
  const tLen = text.length
  const kLen = key.length
  let out = ''
  for (let i = 0; i < tLen; i++) {
    const car = text.charCodeAt(i)
    const cod = key.charCodeAt(i % kLen)
    const xor = cod ^ car
    const hex = (pad + xor.toString(16)).slice(-2).toUpperCase()
    out += hex
  }
  return out
}

export function generateLicensePayload(input) {
  // Input mirrors PHP variables
  // fecha: YYYY-MM-DD
  // id_version, version_letras, id_hosting, hosting_letras, email, organizacion,
  // activador_letras, pais_letras, admins, tablets, telefonicos, dataEntries,
  // analizadores, clasificadores, supsCaptura, supsKiosco, clientes, preguntas

  const PalabraMagica = 'yiyo'
  const Major = '4'
  const Minor = '3'

  const fechaVence = input.fecha
  const [ano_vence, mes_vence, dia_vence] = fechaVence.split('-')

  const now = new Date()
  const dia = String(now.getDate()).padStart(2, '0')
  const mes = String(now.getMonth() + 1).padStart(2, '0')
  const ano = String(now.getFullYear())

  const VersionRotator = input.id_version
  const VersionRotator_letras = input.version_letras
  const planHosting = input.id_hosting
  const hosting_letras = input.hosting_letras
  const correo = input.email
  const Organizacion = input.organizacion
  const Activador2Letras = input.activador_letras
  const Pais_letras = input.pais_letras

  const Admins = Number(input.admins)
  const Tablets = Number(input.tablets)
  const Telefonicos = Number(input.telefonicos)
  const DataEntries = Number(input.dataEntries)
  const Analizadores = Number(input.analizadores)
  const Clasificadores = Number(input.clasificadores)
  const SupsCaptura = Number(input.supsCaptura)
  const SupsKiosco = Number(input.supsKiosco)
  const Clientes = Number(input.clientes)
  const Preguntas = Number(input.preguntas)

  const EsServer = '0'

  const parts = correo.split('@')
  const correoLetras = (parts[0].slice(0, 2) + parts[1].slice(0, 1)).toUpperCase()
  const Org_2letras = (Organizacion.slice(0, 1) + Organizacion.slice(-1)).toUpperCase()

  const Clave = [
    'V' + Major,
    Minor + '.6305530.' + VersionRotator,
    dia,
    mes,
    ano,
    String(parseInt(dia_vence, 10)),
    String(parseInt(mes_vence, 10)),
    String(parseInt(ano_vence, 10)),
    String(planHosting),
    EsServer,
    Admins,
    Tablets,
    Telefonicos,
    DataEntries,
    Analizadores,
    Clasificadores,
    SupsCaptura,
    SupsKiosco,
    Clientes,
    Preguntas
  ].join('.')

  const ClaveEncriptada = utilitarioEncriptar(Clave, PalabraMagica)

  const SerialAdmin = [
    Pais_letras,
    VersionRotator_letras,
    hosting_letras,
    `${dia_vence}${mes_vence}${ano_vence}`,
    correoLetras,
    Org_2letras,
    Activador2Letras
  ].join('-')

  return { serial: SerialAdmin, clave: ClaveEncriptada }
}
