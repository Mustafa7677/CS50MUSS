"""PostgREST-ке ұқсас мини сервер: POST /rest/v1/rpc/<fn> → anon рөлімен public.<fn>(аталған аргументтер)."""
import json, re, psycopg2, psycopg2.extras
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
DSN = os.environ.get("CLOUD_DSN", "host=/var/tmp/cs50pg port=5499 user=postgres dbname=postgres")
PORT = int(os.environ.get("CLOUD_MOCK_PORT", "8799"))
KEY = "sb_publishable_Pc_d_L6MuzJI8_Ugs3QZ1Q_LqnRfzk_"
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "*"); self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        m = re.match(r"^/rest/v1/rpc/(cs50kz_\w+)$", self.path)
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        if not m or self.headers.get("apikey") != KEY:
            return self.reply(401 if m else 404, {"message": "no"})
        args = ", ".join(f"{k} := %s" for k in body)
        vals = [psycopg2.extras.Json(v) if isinstance(v, (dict, list)) else v for v in body.values()]
        con = psycopg2.connect(DSN); con.autocommit = False
        try:
            cur = con.cursor(); cur.execute("set local role anon")
            cur.execute(f"select public.{m.group(1)}({args})", vals)
            row = cur.fetchone(); con.commit()
            self.reply(200, row[0] if row else None)
        except psycopg2.Error as e:
            con.rollback()
            self.reply(401 if e.pgcode == "28000" else 400, {"code": e.pgcode, "message": e.diag.message_primary})
        finally:
            con.close()
    def reply(self, code, obj):
        b = json.dumps(obj, default=str).encode()
        self.send_response(code); self.cors(); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(b)
ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
