function getDatos() {
  return {
    isp: {
      host: document.getElementById("isp-ip").value,
      username: document.getElementById("isp-user").value,
      password: document.getElementById("isp-pass").value,
    },
    destino: {
      host: document.getElementById("router-ip").value,
      username: document.getElementById("router-user").value,
      password: document.getElementById("router-pass").value,
    },
    interface: document.getElementById("interface").value,
    ip: document.getElementById("ip").value,
    mask: document.getElementById("mask").value,
  };
}

async function consultar(endpoint) {
  const params = getDatos();
  const response = await fetch(`http://localhost:8000/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  document.getElementById("resultado").textContent = JSON.stringify(data, null, 2);
}

async function crud(metodo) {
  const params = getDatos();
  let endpoint = "interface";
  const response = await fetch(`http://localhost:8000/${endpoint}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  document.getElementById("resultado").textContent = JSON.stringify(data, null, 2);
}
