document.getElementById("form-cdp").addEventListener("submit", async function (e) {
  e.preventDefault();

  const ip = document.getElementById("ip").value;
  const usuario = document.getElementById("usuario").value;
  const clave = document.getElementById("clave").value;

  const respuesta = await fetch("http://localhost:8000/cdp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device: {
        device_type: "cisco_ios",
        host: ip,
        username: usuario,
        password: clave
      }
    })
  });

  const data = await respuesta.json();
  const lista = document.getElementById("lista-vecinos");
  lista.innerHTML = "";

  // ✅ Mostrar la sección de resultados
  document.getElementById("resultado").style.display = "block";

  if (data.error) {
    lista.innerHTML = `<li style="color:red;">❌ ${data.error}</li>`;
    return;
  }

  if (data.length === 0) {
    lista.innerHTML = `<li>⚠️ No se encontraron vecinos CDP.</li>`;
    return;
  }

  data.forEach((v) => {
    lista.innerHTML += `<li>🖧 ${v.hostname} (${v.ip}) - ${v.platform} | ${v.local_port} ⇆ ${v.remote_port}</li>`;
  });
});
