import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default (req: NextApiRequest, res: NextApiResponse) => {
  const password = req.body.password as string;

  const valid = password === process.env.PORTFOLIO_PASSWORD;

  if (valid) {
    const filePath = path.join(process.cwd(), "private", "portfolio.pdf");

    if (!fs.existsSync(filePath)) {
      res.status(500).send("Datei nicht gefunden");
    }

    const stat = fs.statSync(filePath);

    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=portfolio.pdf");

    const fileContents = fs.readFileSync(filePath);

    res.status(200).send(fileContents);
  } else res.status(403).send("Falsches Passwort");
};
