'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import generateQr from 'sepa-payment-qr-code'

type ErrorState = {
  name?: string;
  iban?: string;
  amount?: string;
  general?: string;
}

export default function SepaQRCodeGenerator() {
  const [formData, setFormData] = useState({
    name: '',
    iban: '',
    amount: '',
    reference: '',
  })
  const [qrCode, setQrCode] = useState('')
  const [errors, setErrors] = useState<ErrorState>({})

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.async = true
    script.onload = () => console.log('QRCode.js cargado correctamente')
    script.onerror = () => console.error('Error al cargar QRCode.js')
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setErrors(prev => ({ ...prev, [e.target.name]: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: ErrorState = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del beneficiario es requerido.'
    }

    if (!formData.iban.trim()) {
      newErrors.iban = 'El IBAN es requerido.'
    } else if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(formData.iban.replace(/\s/g, ''))) {
      newErrors.iban = 'El formato del IBAN no es válido.'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'La cantidad es requerida.'
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'La cantidad debe ser un número positivo.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateQRCode = () => {
    if (!validateForm()) {
      return
    }

    try {
      console.log('Intentando generar QR con los siguientes datos:', formData)

      const qrData = generateQr({
        name: formData.name,
        iban: formData.iban.replace(/\s/g, ''),
        amount: parseFloat(formData.amount),
        reference: formData.reference || undefined
      })

      console.log('Datos QR generados:', qrData)

      if (typeof window.QRCode === 'undefined') {
        throw new Error('La biblioteca QRCode.js no está cargada correctamente')
      }

      const qrContainer = document.createElement('div')
      new window.QRCode(qrContainer, {
        text: qrData,
        width: 250,
        height: 250,
      })

      const qrImage = qrContainer.querySelector('img')
      if (qrImage) {
        setQrCode(qrImage.src)
      } else {
        throw new Error('No se pudo generar la imagen del código QR')
      }

      setErrors({})
    } catch (err) {
      console.error('Error detallado:', err)

      if (err instanceof Error) {
        if (err.message.includes('IBAN')) {
          setErrors(prev => ({ ...prev, iban: 'El IBAN proporcionado no es válido.' }))
        } else if (err.message.includes('amount')) {
          setErrors(prev => ({ ...prev, amount: 'La cantidad proporcionada no es válida.' }))
        } else if (err.message.includes('QRCode.js')) {
          setErrors(prev => ({ ...prev, general: 'Error al cargar la biblioteca de generación de QR. Por favor, recarga la página.' }))
        } else {
          setErrors(prev => ({ ...prev, general: `Error al generar el código QR: ${err.message}` }))
        }
      } else {
        setErrors(prev => ({ ...prev, general: 'Error desconocido al generar el código QR. Por favor, verifica tu conexión e intenta de nuevo.' }))
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Generador de Código QR para Pagos SEPA</CardTitle>
        <CardDescription>Ingresa los detalles del pago para generar un código QR</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del beneficiario</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nombre del beneficiario"
              required
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              name="iban"
              value={formData.iban}
              onChange={handleInputChange}
              placeholder="ES91 2100 0418 4502 0005 1332"
              required
            />
            {errors.iban && <p className="text-red-500 text-sm">{errors.iban}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Cantidad (en euros)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="100.00"
              required
            />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Referencia (opcional)</Label>
            <Input
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleInputChange}
              placeholder="Factura #12345"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        <Button onClick={generateQRCode} className="w-full">Generar Código QR</Button>
        {errors.general && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}
        {qrCode && (
          <div className="mt-4">
            <img src={qrCode} alt="Código QR de Pago SEPA" className="w-64 h-64" />
          </div>
        )}
      </CardFooter>
    </Card>
  )
}