from netmiko import ConnectHandler
import time

ip_iswl = input("IP del ISW1: ")
ip_isp = "64.15.1.2"

usuario_iswl = "iswl"
clave_iswl = "iswl"
usuario_isp = "isp"
clave_isp = "isp"

iswl = {
    'device_type': 'cisco_ios',
    'host': ip_iswl,
    'username': usuario_iswl,
    'password': clave_iswl,
    'secret': clave_iswl,
    'fast_cli': False
}

try:
    print(f"Conectando a ISW1 ({ip_iswl})...")
    conexion = ConnectHandler(**iswl)

    print("[*] Entrando en modo enable en ISW1...")
    conexion.enable()

    print(f"[*] Realizando SSH a ISP ({ip_isp}) desde ISW1...")
    conexion.write_channel(f"ssh -l {usuario_isp} {ip_isp}\n")
    time.sleep(1)

    salida = conexion.read_until_pattern("Password:")
    if "Password" in salida:
        conexion.write_channel(clave_isp + "\n")
        time.sleep(1)

        conexion.write_channel("enable\n")
        time.sleep(1)
        salida = conexion.read_until_pattern("Password:")
        if "Password" in salida:
            conexion.write_channel(clave_isp + "\n")
            time.sleep(1)

        conexion.write_channel("terminal length 0\n")
        time.sleep(0.5)
        conexion.write_channel("show running-config\n")
        time.sleep(3)

        salida = conexion.read_channel()
        print("\n--- CONFIGURACIÓN ISP ---\n")
        print(salida)
    else:
        print("❌ Error en autenticación SSH al ISP.")

    conexion.disconnect()

except Exception as e:
    print(f"❌ Error general: {e}")
