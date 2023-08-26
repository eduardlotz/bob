import { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => {
  const password = req.body.password as string;

  const valid = password === process.env.PORTFOLIO_PASSWORD;

  if (valid) res.status(200);
  else res.status(403);
};
