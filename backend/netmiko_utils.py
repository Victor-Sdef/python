from netmiko import ConnectHandler

def obtener_vecinos_cdp(device):
    try:
        with ConnectHandler(**device) as conn:
            output = conn.send_command("show cdp neighbors detail")
            return parsear_cdp(output)
    except Exception as e:
        return {"error": str(e)}

def parsear_cdp(salida):
    bloques = salida.split("-------------------------")
    vecinos = []

    for bloque in bloques:
        if "Device ID" in bloque:
            vecino = {}
            lineas = bloque.splitlines()
            for linea in lineas:
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
