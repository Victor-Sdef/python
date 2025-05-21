// js/explorador.js
let nodes = new vis.DataSet();
let edges = new vis.DataSet();
let network;
const container = document.getElementById("mynetwork");
const terminal = document.getElementById("terminal-output");
const tablaBody = document.querySelector("#tabla-dispositivos tbody");

function logTerminal(msg) {
  terminal.innerHTML += msg + "\n";
  terminal.scrollTop = terminal.scrollHeight;
}

document.getElementById("form-inicial").addEventListener("submit", async function (e) {
  e.preventDefault();
  const ip = document.getElementById("ip").value;
  const usuario = document.getElementById("usuario").value;
  const clave = document.getElementById("clave").value;
  const ipSalto = document.getElementById("ip-salto").value;
  const userSalto = document.getElementById("usuario-salto").value;
  const passSalto = document.getElementById("clave-salto").value;

  const ruta = [
    { host: ip, username: usuario, password: clave },
    { host: ipSalto, username: userSalto, password: passSalto }
  ];

  const res = await fetch("http://localhost:8000/cdp-multisalto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saltos: ruta })
  });

  const topologia = await res.json();
  if (topologia.error) {
    logTerminal("❌ Error: " + topologia.error);
    return;
  }

  topologia.forEach(segmento => {
    const origenId = segmento.origen;
    if (!nodes.get(origenId)) {
      nodes.add({ id: origenId, label: origenId, shape: "box", color: "#00bcd4" });
    }

    segmento.vecinos.forEach((vecino, i) => {
      const id = vecino.hostname || `vecino-${i}-${origenId}`;
      if (!nodes.get(id)) {
        nodes.add({
          id: id,
          label: `${vecino.hostname}\n${vecino.ip}`,
          shape: "ellipse",
          color: "#00eaff"
        });
      }
      edges.add({
        from: origenId,
        to: id,
        label: `${vecino.local_port} ⇄ ${vecino.remote_port}`,
        arrows: "to",
        font: { align: "middle" }
      });
    });
  });

  if (!network) {
    network = new vis.Network(container, { nodes, edges }, {
      nodes: { font: { color: "#000" } },
      edges: { color: "#555", width: 2 },
      physics: { stabilization: true }
    });
  } else {
    network.setData({ nodes, edges });
  }

  logTerminal(`✅ Topología detectada`);
});
