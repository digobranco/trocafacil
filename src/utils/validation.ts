/**
 * Validates a CPF string.
 * Following Brazilian standards: 11 digits and algorithm check.
 */
export function validateCPF(cpf: string): boolean {
    if (!cpf) return false

    // Remove non-digits
    const cleanCPF = cpf.replace(/\D/g, '')

    // Must be 11 digits
    if (cleanCPF.length !== 11) return false

    // Avoid known invalid CPFs (all digits equal)
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false

    // Validation algorithm
    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
    }

    remainder = (sum * 10) % 11

    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
    }

    remainder = (sum * 10) % 11

    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false

    return true
}

/**
 * Formats a CPF string: 000.000.000-00
 */
export function formatCPF(value: string): string {
    const cleanValue = value.replace(/\D/g, '')
    
    if (cleanValue.length <= 3) {
        return cleanValue
    }
    if (cleanValue.length <= 6) {
        return cleanValue.replace(/(\d{3})(\d{0,3})/, '$1.$2')
    }
    if (cleanValue.length <= 9) {
        return cleanValue.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
    }
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').substring(0, 14)
}
