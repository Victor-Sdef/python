from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from netmiko import ConnectHandler
import paramiko

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ====================== MODELOS ======================

class Salto(BaseModel):
    host: str
    username: str
    password: str

class Ruta(BaseModel):
    saltos: List[Salto]

class Dispositivo(BaseModel):
    host: str
    username: str
    password: str
    interface: Optional[str] = None
    ip: Optional[str] = None
    mask: Optional[str] = None
    jump_host: Optional[str] = None
    jump_user: Optional[str] = None
    jump_pass: Optional[str] = None

class Credenciales(BaseModel):
    ip: str
    username: str
    password: str

# ====================== FUNCIONES AUXILIARES ======================

def parsear_cdp(salida):
    bloques = salida.split("-------------------------")
    vecinos = []
    for bloque in bloques:
        if "Device ID" in bloque:
            vecino = {}
            for linea in bloque.splitlines():
                if "Device ID:" in linea:
                    vecino["hostname"] = linea.split("Device ID:")[1].strip()
                elif "IP address:" in linea:
                    vecino["ip"] = linea.split("IP address:")[1].strip()
                elif "Platform:" in linea:
                    vecino["platform"] = linea.split("Platform:")[1].split(",")[0].strip()
                elif "Interface:" in linea:
                    partes = linea.split(",")
                    vecino["local_port"] = partes[0].split("Interface:")[1].strip()
                    vecino["remote_port"] = partes[1].split("Port ID (outgoing port):")[1].strip()
            if vecino:
                vecinos.append(vecino)
    return vecinos

def extraer_hostname(salida):
    for linea in salida.splitlines():
        linea = linea.strip()
        if linea.endswith("#") or linea.endswith(">"):
            return linea.replace("#", "").replace(">", "").strip()
    return None

def conectar_con_salto(d: Dispositivo):
    conn = ConnectHandler(
        device_type="cisco_ios",
        host=d.jump_host or d.host,
        username=d.jump_user or d.username,
        password=d.jump_pass or d.password,
        secret=""
    )
    conn.write_channel("enable\n")
    conn.read_until_pattern(r"[#>]", read_timeout=5)
    if d.jump_host and d.jump_host != d.host:
        conn.write_channel(f"ssh -l {d.username} {d.host}\n")
        conn.read_until_pattern(r"[Pp]assword:", read_timeout=10)
        conn.write_channel(d.password + "\n")
        conn.read_until_pattern(r"[#>]", read_timeout=10)
        conn.write_channel("enable\n")
        conn.read_until_pattern(r"[#>]", read_timeout=10)
        conn.write_channel("\n")
        conn.read_until_pattern(r"[#>]", read_timeout=10)
        conn.set_base_prompt()
    conn.write_channel("terminal length 0\n")
    conn.read_until_pattern(r"[#>]", read_timeout=5)
    return conn

def execute_command(ip, username, password, command):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password)
    stdin, stdout, stderr = ssh.exec_command(command)
    output = stdout.read().decode().strip()
    ssh.close()
    return output

# ====================== ENDPOINTS ======================

@app.post("/cdp-multisalto")
def explorar_topologia(ruta: Ruta):
    try:
        conexion = None
        topologia = []
        for idx, salto in enumerate(ruta.saltos):
            if idx == 0:
                conexion = ConnectHandler(
                    device_type="cisco_ios",
                    host=salto.host,
                    username=salto.username,
                    password=salto.password
                )
            else:
                comando_ssh = f"ssh -l {salto.username} {salto.host}\n"
                conexion.write_channel(comando_ssh)
                conexion.read_until_pattern("Password:", read_timeout=10)
                conexion.write_channel(salto.password + "\n")
                conexion.read_until_pattern(r"[#>]", read_timeout=10)
            conexion.write_channel("terminal length 0\n")
            conexion.read_until_pattern(r"[#>]", read_timeout=5)
            conexion.write_channel("show cdp neighbors detail\n")
            salida = conexion.read_until_pattern(r"[#>]", read_timeout=10)
            hostname_origen = extraer_hostname(salida) or salto.host
            vecinos = parsear_cdp(salida)
            topologia.append({
                "origen": hostname_origen,
                "vecinos": vecinos
            })
            if idx > 0:
                conexion.write_channel("exit\n")
                conexion.read_until_pattern(r"[#>]", read_timeout=5)
        conexion.disconnect()
        return topologia
    except Exception as e:
        return {"error": str(e)}

@app.post("/router-hostname")
def obtener_hostname(d: Dispositivo):
    conn = conectar_con_salto(d)
    conn.send_command("terminal length 0", expect_string=r"#", read_timeout=5)
    conn.write_channel("\n")
    conn.read_until_pattern(r"[#>]", read_timeout=5)
    salida = conn.send_command("show running-config | include hostname", read_timeout=5)
    conn.disconnect()
    return {"resultado": salida}

@app.post("/router-info")
def obtener_info(d: Dispositivo):
    conn = conectar_con_salto(d)
    salida = conn.send_command("show ip interface brief")
    conn.disconnect()
    return {"resultado": salida}

@app.post("/router-routes")
def obtener_rutas(d: Dispositivo):
    conn = conectar_con_salto(d)
    conn.write_channel("\n")
    conn.read_until_pattern(r"[#>]", read_timeout=10)
    try:
        conn.enable()
    except:
        pass
    salida = conn.send_command("show cdp neighbors", read_timeout=25)
    conn.disconnect()
    return {"resultado": salida}

@app.post("/interface")
def crear_interfaz(d: Dispositivo):
    conn = conectar_con_salto(d)
    cmds = [
        f"interface {d.interface}",
        f"ip address {d.ip} {d.mask}",
        "no shutdown"
    ]
    salida = conn.send_config_set(cmds)
    conn.disconnect()
    return {"resultado": salida}

@app.post("/interface/edit")
def editar_interfaz(d: Dispositivo):
    conn = conectar_con_salto(d)
    try:
        conn.enable()
    except:
        pass
    cmds = [
        f"interface {d.interface}",
        "shutdown",
        "no ip address",
        f"ip address {d.ip} {d.mask}",
        "no shutdown"
    ]
    salida = conn.send_config_set(cmds)
    conn.disconnect()
    return {"resultado": salida}

# Función auxiliar para conectarse vía SSH y ejecutar un comando
def execute_command(ip, username, password, command):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password)
        stdin, stdout, stderr = ssh.exec_command(command)
        output = stdout.read().decode().strip()
        ssh.close()
        return output
    except paramiko.AuthenticationException:
        return "❌ Error de autenticación SSH"
    except Exception as e:
        return f"❌ Error de conexión: {str(e)}"

# Endpoint para consultar el estado del servicio Zabbix
@app.post("/status")
def get_status(cred: Credenciales):
    output = execute_command(
        cred.ip, cred.username, cred.password, 
        "systemctl is-active zabbix-server"
    )
    return {"status": output}

# Endpoint para controlar el servicio Zabbix (start/stop/restart)
@app.post("/control/{action}")
def control_zabbix(action: str, cred: Credenciales = Body(...)):
    if action not in ["start", "stop", "restart"]:
        return {"message": "Acción inválida"}
    output = execute_command(
        cred.ip, cred.username, cred.password,
        f"sudo systemctl {action} zabbix-server"
    )
    return {"message": f"Zabbix {action}: {output}"}


@app.post("/login")
def login(d: Dispositivo):
    try:
        conn = ConnectHandler(
            device_type="linux",
            host=d.jump_host or d.host,
            username=d.jump_user or d.username,
            password=d.jump_pass or d.password
        )

        if d.jump_host and d.jump_host != d.host:
            conn.write_channel(f"ssh -l {d.username} {d.host}\n")
            salida = conn.read_until_pattern(r"[Pp]assword:|yes/no", read_timeout=10)

            if "yes/no" in salida:
                conn.write_channel("yes\n")
                conn.read_until_pattern(r"[Pp]assword:", read_timeout=10)

            conn.write_channel(d.password + "\n")
            conn.read_until_pattern(r"[#\$]", read_timeout=10)

        conn.write_channel("whoami\n")
        respuesta = conn.read_until_pattern(r"#|\$", read_timeout=10)

        prompt = conn.find_prompt()
        conn.disconnect()

        return {
            "mensaje": f"✅ Conexión correcta como {prompt.strip()}",
            "usuario": respuesta.strip()
        }

    except Exception as e:
        return {
            "mensaje": f"❌ Error al conectar: {str(e)}"
        }
