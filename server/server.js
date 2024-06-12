// import express from "express";
// import dotenv from "dotenv";
// import fetch from "node-fetch";
// dotenv.config({ path: "../.env" });

// const app = express();
// const port = 3001;

// // Allow express to parse JSON bodies
// app.use(express.json());

// app.post("/api/token", async (req, res) => {
  
//   // Exchange the code for an access_token
//   const response = await fetch(`https://discord.com/api/oauth2/token`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: new URLSearchParams({
//       client_id: process.env.VITE_DISCORD_CLIENT_ID,
//       client_secret: process.env.DISCORD_CLIENT_SECRET,
//       grant_type: "authorization_code",
//       code: req.body.code,
//     }),
//   });

//   // Retrieve the access_token from the response
//   const { access_token } = await response.json();

//   // Return the access_token to our client as { access_token: "..."}
//   res.send({access_token});
// });

// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });





import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import ytdl from 'ytdl-core';
import fs from 'fs-extra';
import path from 'path';

dotenv.config({ path: "../.env" });

const app = express();
const port = 3001;

app.use(express.json());

app.post("/api/token", async (req, res) => {
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.VITE_DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  const { access_token } = await response.json();
  res.send({ access_token });
});

app.post('/api/download', async (req, res) => {
  const { url } = req.body;
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ message: 'Invalid URL' });
  }

  const downloadStream = ytdl(url, { filter: 'audioonly' });
  const filePath = path.join(__dirname, 'public', 'audio.mp3');
  const writeStream = fs.createWriteStream(filePath);

  downloadStream.pipe(writeStream);

  downloadStream.on('end', () => {
    res.json({ message: 'Download complete' });
  });

  downloadStream.on('error', (err) => {
    console.error(err);
    res.status(500).json({ message: 'Download failed' });
  });
});

app.get('/api/play', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'audio.mp3');
  if (fs.existsSync(filePath)) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
