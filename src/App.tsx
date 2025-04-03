import { MalgaTokenization } from '@malga/tokenization'
import React, { useEffect, useRef, useState, FormEvent } from 'react'

// Substitua por suas chaves reais
const malgaTokenization = new MalgaTokenization({
  apiKey: 'bfabc953-1ea0-45d0-95e4-4968cfe2a00e',
  clientId: '4457c178-0f07-4589-ba0e-954e5816fd0f',
  options: {
    sandbox: true, // ambiente de testes
    config: {
      fields: {
        cardNumber: {
          container: 'card-number',
          placeholder: '9999 9999 9999 9999',
          type: 'text',
        },
        cardHolderName: {
          container: 'card-holder-name',
          placeholder: 'Nome do Titular',
          type: 'text',
        },
        cardExpirationDate: {
          container: 'card-expiration-date',
          placeholder: 'MM/YY',
          type: 'text',
        },
        cardCvv: {
          container: 'card-cvv',
          placeholder: '999',
          type: 'text',
        },
      },
      styles: {
        input: {
          color: '#000',
          'font-size': '16px',
        },
      },
      preventAutofill: false,
    },
  },
})

export default function App() {
  const [tokenId, setTokenId] = useState('')
  const alreadyInitialized = useRef(false)

  useEffect(() => {
    // Inicializa a MalgaTokenization apenas uma vez
    if (!alreadyInitialized.current) {
      malgaTokenization.init()
      alreadyInitialized.current = true
    }
  }, [])

  async function handleGetTokenId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // evitar reload da página

    const { tokenId, error } = await malgaTokenization.tokenize()

    if (error) {
      console.error('Erro na tokenização:', error)
      return
    }

    // Se deu certo, salvamos o token
    console.log('Token gerado:', tokenId)
    setTokenId(tokenId)

    // Aqui você poderia chamar seu backend para enviar o token
    // e fazer a cobrança ou armazenar, ex. via fetch/axios
  }

  return (
    <main>
      <form onSubmit={handleGetTokenId}>
        <section>
          <div className="form-group">
            <label htmlFor="card-number">Card Number</label>
            {/* Div que receberá o iFrame do número do cartão */}
            <div id="card-number" className="form-control" />
          </div>

          <div className="form-group">
            <label htmlFor="card-holder-name">Card Holder Name</label>
            <div id="card-holder-name" className="form-control" />
          </div>

          <div className="form-group">
            <label htmlFor="card-cvv">Card CVV</label>
            <div id="card-cvv" className="form-control" />
          </div>

          <div className="form-group">
            <label htmlFor="card-expiration-date">Card Expiration Date</label>
            <div id="card-expiration-date" className="form-control" />
          </div>
        </section>

        <button type="submit">Submit</button>
      </form>

      {tokenId && (
        <p style={{ marginTop: '1rem' }}>
          Token gerado: <strong>{tokenId}</strong>
        </p>
      )}
    </main>
  )
}
