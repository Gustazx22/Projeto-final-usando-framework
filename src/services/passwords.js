export function validatePasswordChange({ currentPassword, newPassword }) {
  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw new Error('Informe sua senha atual.')
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8 || !newPassword.trim()) {
    throw new Error('A nova senha deve ter pelo menos 8 caracteres.')
  }
  if (newPassword === currentPassword) {
    throw new Error('A nova senha deve ser diferente da atual.')
  }
}
