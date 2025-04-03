import { MalgaTokenization } from '@malga/tokenization'
import { useEffect, useRef } from 'react'

const malgaTokenization = new MalgaTokenization({
  apiKey: 'bfabc953-1ea0-45d0-95e4-4968cfe2a00e',
  clientId: '4457c178-0f07-4589-ba0e-954e5816fd0f',
  options: { sandbox: true },
})

export function App() {
  const isRendered = useRef(false)

  useEffect(() => {
    if (isRendered.current) {
      malgaTokenization.init()
    }

    isRendered.current = true
  }, [])

  return (
    <main>
      <form
        action="http://localhost:3000/checkout"
        method="POST"
        data-malga-tokenization-form
      >
        <input
          data-malga-tokenization-holder-name
          name="holderName"
          type="text"
          placeholder="Card Holder Name"
        />
        <input
          data-malga-tokenization-number
          name="number"
          type="number"
          placeholder="Card Number"
        />
        <input
          data-malga-tokenization-expiration-date
          name="expirationDate"
          type="text"
          placeholder="Card Expiration Date"
        />
        <input
          data-malga-tokenization-cvv
          name="cvv"
          type="number"
          placeholder="Card CVV"
        />
        <button type="submit">Submit</button>
      </form>
    </main>
  )
}
