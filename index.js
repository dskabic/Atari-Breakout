const express = require('express')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000;
const path = require('path');
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

if (externalUrl) {
  const hostname = '0.0.0.0';
  app.listen(port, hostname, () => {
    console.log(`Server locally running on http://${hostname}:${port}/ and externally on ${externalUrl}`)
  })
}
else {
  app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  })
}