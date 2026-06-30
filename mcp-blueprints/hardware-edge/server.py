import sys
import os
import json
import time

# Note: Users of this blueprint need to install:
# pip install pyserial pymodbus
import serial
from pymodbus.client import ModbusTcpClient
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("hardware-edge-sensors")

# --- Configuration (Pulled from Environment Variables in mcps.json) ---
SERIAL_PORT = os.environ.get("SCALE_COM_PORT", "COM3")
SERIAL_BAUD = int(os.environ.get("SCALE_BAUDRATE", "9600"))

MODBUS_HOST = os.environ.get("MODBUS_SENSOR_IP", "192.168.1.100")
MODBUS_PORT = int(os.environ.get("MODBUS_PORT", "502"))

@mcp.tool()
def read_scale_weight() -> str:
    """
    Connect to a serial weighing scale and read the current weight.
    Useful for Mettler Toledo, Ohaus, or generic RS-232/USB scales.
    """
    try:
        # Example of real pyserial implementation:
        with serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=2) as ser:
            ser.write(b'P\r\n') # Common command to request print/weight
            time.sleep(0.5)
            if ser.in_waiting > 0:
                reading = ser.readline().decode('ascii').strip()
                return f"Success: Scale reading is {reading}"
            return "Error: No data received from scale."
    except Exception as e:
        return f"Hardware Error: Failed to connect to scale on {SERIAL_PORT}: {str(e)}"

@mcp.tool()
def read_temperature_sensor(register_address: int = 100) -> str:
    """
    Read current temperature from a Modbus TCP industrial thermal sensor.
    """
    try:
        # Example of real pymodbus implementation:
        client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
        if client.connect():
            # Read holding register containing the temperature (e.g., scaled by 10)
            result = client.read_holding_registers(address=register_address, count=1, slave=1)
            client.close()
            
            if not result.isError():
                temp_c = result.registers[0] / 10.0
                return f"Sensor Reading: {temp_c}°C"
            else:
                return f"Error: Failed to read register {register_address}"
        else:
            return f"Error: Could not connect to Modbus device at {MODBUS_HOST}:{MODBUS_PORT}"
    except Exception as e:
        return f"Hardware Error: Modbus TCP failure: {str(e)}"

@mcp.tool()
def read_pressure_sensor(register_address: int = 200) -> str:
    """
    Read current pressure from a Modbus TCP industrial pressure sensor.
    """
    try:
        client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
        if client.connect():
            # Read holding register containing the pressure (e.g., in PSI)
            result = client.read_holding_registers(address=register_address, count=1, slave=1)
            client.close()
            
            if not result.isError():
                pressure_psi = result.registers[0]
                return f"Sensor Reading: {pressure_psi} PSI"
            else:
                return f"Error: Failed to read register {register_address}"
        else:
            return f"Error: Could not connect to Modbus device at {MODBUS_HOST}:{MODBUS_PORT}"
    except Exception as e:
        return f"Hardware Error: Modbus TCP failure: {str(e)}"


if __name__ == "__main__":
    mcp.run(transport='stdio')
