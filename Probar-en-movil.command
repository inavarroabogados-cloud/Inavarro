#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Necesitas Python 3: instálalo desde python.org y vuelve a abrir este archivo.'
  read -r -p 'Pulsa Intro para cerrar.'
  exit 1
fi
python3 scripts/probar-movil.py
read -r -p 'Pulsa Intro para cerrar.'
