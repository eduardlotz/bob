import { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => {
  const password = req.body.password as string;

  const valid = password === process.env.PORTFOLIO_PASSWORD;

  if (valid) {
    res.status(200).send("Richtiges Passwort");
  } else res.status(403).send("Falsches Passwort");
};
