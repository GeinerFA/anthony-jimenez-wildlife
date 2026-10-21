# Pendientes de seguridad

Tareas que quedaron después de la revisión de seguridad de octubre de 2026.
**Cuando termines una, borra su sección. Cuando no quede ninguna, borra este archivo.**

---

## 1. Agregar el registro DMARC

**Por qué:** le indica a Gmail, Outlook, etc. qué hacer con correos falsos que usen `@anthonyjimenezwildlife.com`. SPF y DKIM ya están configurados; solo falta este.

**Pasos:**
1. Entra a **account.squarespace.com/domains** → **anthonyjimenezwildlife.com** → **DNS** → **DNS Settings**.
2. En **Custom records**, pulsa **Add record**:
   - **Host:** `_dmarc`
   - **Type:** `TXT`
   - **Data:** `v=DMARC1; p=none; rua=mailto:info@anthonyjimenezwildlife.com`
3. Guarda.
4. Confirma que DKIM esté activo: **admin.google.com** → **Apps** → **Google Workspace** → **Gmail** → **Autenticar correo electrónico**. Debe decir "Autenticando correo electrónico con DKIM".
5. Comprueba en **toolbox.googleapps.com/apps/checkmx** (dominio `anthonyjimenezwildlife.com`) que DMARC aparezca.

**Al terminar:** anota la fecha en la tarea 4 y borra esta sección.

---

## 2. Borrar el proyecto viejo de Neon

**Por qué:** el proyecto con host `ep-withered-wildflower-b4unjsfh` ya no lo usa el sitio, pero guarda una **copia completa de los datos, incluidas las solicitudes de clientes**. Una copia olvidada es un riesgo innecesario.

**No lo confundas con estos, que se usan:**
- **Anthony Jimenez Wildlife | Production**, rama `production` (`ep-spring-dawn…`): la base del sitio en vivo.
- La rama `dev` (`ep-wandering-band…`), en el mismo proyecto: la de tu computadora y las previews.

**Pasos:**
1. En **console.neon.tech**, ve a **All projects**.
2. Identifica el proyecto que **no** es "Anthony Jimenez Wildlife | Production". Para confirmarlo, pulsa **Connect** y revisa que el host contenga `withered-wildflower`.
3. Opcional: si quieres guardar un respaldo antes, descárgalo y guárdalo **fuera** de la computadora del trabajo.
4. **Settings** → **Delete project**.
5. Revisa que `www.anthonyjimenezwildlife.com` siga funcionando (abre un tour y el formulario).

---

## 3. Revisión legal de la Política de privacidad

**Por qué:** el texto actual es un borrador técnico. Debe cumplir la Ley 8968 de Costa Rica y, para turistas europeos, el RGPD.

**Pasos:**
1. Pasa el texto a un abogado. Está en el sitio (`www.anthonyjimenezwildlife.com/es/privacidad` y `/en/privacy`) y en el código, en `messages/es.json` y `messages/en.json`, sección `Privacy`.
2. Aplica las correcciones en esos dos archivos y cambia la fecha en `updated` ("Última actualización…").
3. Revisa también el texto de la casilla del formulario: `Request.consent` en los mismos archivos.

---

## 4. Endurecer DMARC

**Cuándo:** de 2 a 4 semanas **después** de terminar la tarea 1.
DMARC agregado el: `____ / ____ / ______`

**Por qué:** con `p=none` solo se reciben reportes; con `p=quarantine`, los correos falsos con tu dominio van a spam.

**Pasos:**
1. Durante esas semanas, confirma que los correos de info@ y los del formulario siguen llegando bien. Revisa que no lleguen a spam.
2. En Squarespace, edita el registro `_dmarc` y cambia `p=none` por `p=quarantine`:
   `v=DMARC1; p=quarantine; rua=mailto:info@anthonyjimenezwildlife.com`
3. Guarda.
