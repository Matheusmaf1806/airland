import { MalgaTokenization } from '@malga/tokenization'
import React, { useState, FormEvent } from 'react'

const malgaTokenization = new MalgaTokenization({
  apiKey: 'bfabc953-1ea0-45d0-95e4-4968cfe2a00e',
  clientId: '4457c178-0f07-4589-ba0e-954e5816fd0f',
  options: {
    sandbox: true,
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

  async function handleGetTokenId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const { tokenId, error } = await malgaTokenization.tokenize()

    if (error) {
      console.error('Erro na tokenização:', error)
      return
    }

    console.log('Token gerado:', tokenId)
    setTokenId(tokenId)
    // Aqui você pode enviar esse token ao seu backend (ex. via fetch/axios)
  }

  return (
    <main>
      <form onSubmit={handleGetTokenId}>
        <section>
          <div className="form-group">
            <label htmlFor="card-number">Card Number</label>
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
