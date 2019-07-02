import { toast } from 'react-toastify'

export const showError = () => {
  toast.error('Unknown error', {
    autoClose: false,
    position: 'top-center',
  })
}
