function getCreds() {
  return {
    host: document.getElementById("ip").value,
    username: document.getElementById("user").value,
    password: document.getElementById("pass").value,
    jump_host: document.getElementById("ipDestino").value,
    jump_user: document.getElementById("userDestino").value,
    jump_pass: document.getElementById("passDestino").value
  };
}

function logCommand(command, response) {
  const log = document.getElementById("commandOutput");
  log.innerHTML += `\n> ${command}\n${response}\n`;
  log.scrollTop = log.scrollHeight;
}

async function loginSSH() {
  const data = getCreds();
  const comando = "Conexión SSH";

  try {
    const res = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    document.getElementById("statusBox").innerText = result.mensaje || result.message;
    logCommand(comando, result.mensaje || result.message);
  } catch (error) {
    const msg = `❌ Error: ${error.message}`;
    document.getElementById("statusBox").innerText = msg;
    logCommand(comando, msg);
  }
}

async function checkStatus() {
  const data = getCreds();
  const comando = "systemctl is-active zabbix-server";

  try {
    const res = await fetch("http://localhost:8000/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    const estado = `✅ Estado: ${result.status}`;
    document.getElementById("statusBox").innerText = estado;
    logCommand(comando, result.status);
  } catch (error) {
    const msg = `❌ Error: ${error.message}`;
    document.getElementById("statusBox").innerText = msg;
    logCommand(comando, msg);
  }
}

async function controlZabbix(action) {
  const data = getCreds();
  const comando = `sudo systemctl ${action} zabbix-server`;

  try {
    const res = await fetch(`http://localhost:8000/control/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    const msg = result.message || "Respuesta no recibida.";
    document.getElementById("statusBox").innerText = `🔧 ${msg}`;
    logCommand(comando, msg);
  } catch (error) {
    const msg = `❌ Error: ${error.message}`;
    document.getElementById("statusBox").innerText = msg;
    logCommand(comando, msg);
  }
}
