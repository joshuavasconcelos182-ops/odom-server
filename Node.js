const express = require("express");
const app = express();

let valor1 = 0;
let valor2 = 0;

// función para número aleatorio
function generarNumero() {
  return Math.floor(Math.random() * 100) + 1;
}

// lógica cada 500 ms
setInterval(() => {
  const n = generarNumero();

  if (n < 50 && n % 2 !== 0) {
    valor1++;
    valor2++;
    console.log("Incrementa (impar <50):", n);
  } 
  else if (n > 50 && n % 2 === 0) {
    valor1++;
    valor2++;
    console.log("Incrementa (par >50):", n);
  } 
  else {
    console.log("No incrementa:", n);
  }

}, 500);

// endpoint
app.get("/data", (req, res) => {
  res.json({
    valor1,
    valor2
  });
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});