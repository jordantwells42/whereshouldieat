

import { NextApiRequest, NextApiResponse } from 'next'

async function handler (req: NextApiRequest, res: NextApiResponse) {
  const data = await fetch(
    `https://{baseURL}/map/1/tile/{layer}/{style}/{zoom}/{X}/{Y}.{format}?key={Your_API_Key}&view={view}&language=en`,
    {
      mode: 'no-cors',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.YELP_API_KEY}`
      }
    }
    ).then(res => {
      console.log(res)
      return res.json()
    })

  return res.status(200).json(data)
}

export default handler