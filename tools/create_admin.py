# © 2026 Sagid Mustafa. All Rights Reserved.
"""AO17: жалғыз Super Admin аккаунтын бір рет жасау.

    SUPABASE_URL=https://<жоба>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... python3 tools/create_admin.py mustafa_admin

Құпиясөз ЕШҚАШАН аргументпен не файлмен берілмейді: AO_ADMIN_PASSWORD орта айнымалысынан не терминалдан (көрінбейді) оқылады.
Логин «@»-сыз болса, mustafa_admin -> mustafa_admin@admin.ao17.local (assets/js/ao.js-тегі CFG.adminDomain).
Аккаунт email расталған күйде ашылады; бірінші кіргенде құпиясөзді ауыстыру міндетті (must_change_password).
Дерекқорда admin бұрыннан бар болса, ao_bootstrap_admin қабылдамайды - екінші әкімші ашылмайды.
"""
import getpass
import json
import os
import sys
import urllib.error
import urllib.request

ADMIN_DOMAIN = "admin.ao17.local"


def call(method, url, key, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method=method, headers={
        "Authorization": "Bearer " + key, "apikey": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        sys.exit(f"{url.split('/')[-1]}: {e.code} {e.read()[:300].decode('utf-8', 'replace')}")


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    login = sys.argv[1].strip().lower()
    email = login if "@" in login else f"{login}@{ADMIN_DOMAIN}"
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        sys.exit("SUPABASE_URL мен SUPABASE_SERVICE_ROLE_KEY керек")
    pw = os.environ.get("AO_ADMIN_PASSWORD") or getpass.getpass("Уақытша құпиясөз: ")
    if len(pw) < 10:
        sys.exit("Құпиясөз кемінде 10 таңба болсын")
    user = call("POST", url + "/auth/v1/admin/users", key,
                {"email": email, "password": pw, "email_confirm": True, "user_metadata": {"display_name": "Super Admin"}})
    call("POST", url + "/rest/v1/rpc/ao_bootstrap_admin", key, {"p_email": email})
    print(f"Super Admin дайын: логин «{login}» ({email}), id {user.get('id')}. Бірінші кіргенде құпиясөзді ауыстырыңыз.")


if __name__ == "__main__":
    main()
