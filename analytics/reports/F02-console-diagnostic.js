/*
 * אבחון F-02 / F-05 — הדבק בקונסולה (F12) בדף הבית ובדף "צור קשר".
 * הפלט הוא טקסט רגיל בלבד, בלי תגיות HTML — ניתן להעתיק ולהדביק לכל מקום
 * בלי שייחתך או יסונן.
 *
 * הסקריפט אינו מריץ שום קוד מהעמוד: new Function() מהדר בלבד ולא מבצע.
 */
(async function diagnose() {
  var out = [];
  var L = function (s) { out.push(s); };

  L("=== אבחון F-02 / F-05 ===");
  L("URL: " + location.href);
  L("");

  /* ---------- 1. ה-HTML הגולמי מהשרת (לא ה-DOM אחרי עיבוד) ---------- */
  var raw = "";
  try {
    raw = await (await fetch(location.href, { cache: "reload" })).text();
    L("[1] מקור גולמי: " + raw.length + " תווים");
  } catch (e) {
    L("[1] לא ניתן למשוך את המקור: " + e.message);
  }

  if (raw) {
    var open = (raw.match(/<script\b/gi) || []).length;
    var close = (raw.match(/<\/script\s*>/gi) || []).length;
    L("    <script> פתוחות: " + open + " | </script> סגורות: " + close +
      (open === close ? "  ✅ מאוזן" : "  🔴 לא מאוזן — הפרש " + (open - close)));

    /* כל מופע של dataLayer, ובדיקה אם הוא בתוך תגית סקריפט */
    var idx = -1, n = 0;
    while ((idx = raw.indexOf("window.dataLayer", idx + 1)) !== -1) {
      n++;
      var before = raw.slice(0, idx);
      var lastOpen = before.toLowerCase().lastIndexOf("<script");
      var lastClose = before.toLowerCase().lastIndexOf("</script");
      var inside = lastOpen > lastClose;
      var line = before.split("\n").length;
      L("    מופע #" + n + " בשורה " + line + " — " +
        (inside ? "בתוך <script> ✅" : "🔴 מחוץ לכל <script> — זהו F-05"));
      if (!inside) {
        L("      הקשר: ..." + raw.slice(Math.max(0, idx - 90), idx + 60)
          .replace(/\s+/g, " ") + "...");
      }
    }
    if (n === 0) L("    לא נמצא window.dataLayer במקור הגולמי");

    if (/&lt;script/i.test(raw)) L("    🔴 נמצא &lt;script — תגית עברה escaping");
  }

  /* ---------- 2. סקריפטים מוטמעים: מי מהם שבור תחבירית ---------- */
  L("");
  L("[2] בדיקת תחביר בסקריפטים מוטמעים:");
  var inline = [].slice.call(document.querySelectorAll("script:not([src])"));
  var broken = 0, delayed = 0;

  inline.forEach(function (s, i) {
    var type = (s.getAttribute("type") || "").toLowerCase();
    var pm = type.indexOf("pmdelayed") !== -1 ||
             s.hasAttribute("data-perfmatters-type") ||
             type === "text/pmdelayedscript";
    if (pm) delayed++;

    if (type === "module" || type === "application/ld+json") return;

    var code = s.textContent || "";
    if (!code.trim()) return;

    try {
      new Function(code);           /* מהדר בלבד — לא מריץ */
    } catch (err) {
      if (err instanceof SyntaxError) {
        broken++;
        L("  🔴 סקריפט #" + i + (pm ? " [מושהה ע\"י Perfmatters]" : "") +
          " — " + err.message);
        L("     אורך: " + code.length + " תווים");
        L("     תחילה: " + code.slice(0, 160).replace(/\s+/g, " "));
        L("     סוף:   " + code.slice(-160).replace(/\s+/g, " "));
        var idAttr = s.id || s.className || s.getAttribute("data-pmdelayedscript") || "";
        if (idAttr) L("     מזהה:  " + idAttr);
      }
    }
  });

  L("  סה\"כ מוטמעים: " + inline.length +
    " | שבורים: " + broken +
    " | מושהים ע\"י Perfmatters: " + delayed);
  if (broken === 0) {
    L("  ℹ️ אין שגיאת תחביר בסקריפט מוטמע. בדוק קבצים חיצוניים בלשונית Network,");
    L("     ובדוק אם מיניפיקציה/מיזוג פעילים.");
  }
  if (delayed > 0) {
    L("  ⚠️ סקריפטים מושהים אינם מנותחים ע\"י הדפדפן עד לאינטראקציה ראשונה —");
    L("     ולכן שגיאת תחביר בתוכם תיזרק בדיוק ברגע שהמשתמש לוחץ.");
  }

  /* ---------- 3. קוד שדלף כטקסט גלוי ---------- */
  L("");
  L("[3] קוד גלוי בגוף העמוד:");
  var leaked = [].slice.call(document.querySelectorAll("p,div,span,li,td,h1,h2,h3,h4"))
    .filter(function (el) {
      return el.children.length === 0 &&
             /window\.dataLayer|gtag\s*\(|function\s*\(\s*\)\s*\{|dataLayer\.push/.test(el.textContent);
    });
  if (leaked.length) {
    leaked.forEach(function (el) {
      L("  🔴 <" + el.tagName.toLowerCase() + (el.className ? " class=\"" + el.className + "\"" : "") +
        ">: " + el.textContent.trim().slice(0, 120).replace(/\s+/g, " "));
    });
  } else {
    L("  ✅ לא נמצא קוד גלוי ב-DOM (ייתכן שהוא קיים במקור הגולמי — ראה סעיף 1)");
  }

  /* ---------- 4. מצב ה-CTA ---------- */
  L("");
  L("[4] כפתורי CTA:");
  var ctas = [].slice.call(document.querySelectorAll(
    "a[href^='tel:'],a[href*='wa.me'],a[href*='whatsapp'],[class*='call'],[class*='whats']"));
  if (!ctas.length) L("  ⚠️ לא נמצאו כפתורי CTA לפי הסלקטורים הרגילים");
  ctas.slice(0, 12).forEach(function (el) {
    var href = el.getAttribute("href");
    L("  " + el.tagName + " " + (href ? href.slice(0, 48) : "🔴 אין href — תלוי ב-JS"));
  });

  /* ---------- 5. dataLayer חי ---------- */
  L("");
  L("[5] dataLayer: " +
    (Array.isArray(window.dataLayer)
      ? "✅ מערך עם " + window.dataLayer.length + " רשומות"
      : "🔴 אינו מערך — המדידה כנראה מושבתת"));

  var report = out.join("\n");
  console.log(report);
  try {
    await navigator.clipboard.writeText(report);
    console.log("%c✅ הדוח הועתק ללוח — הדבק אותו בשיחה", "color:#256F52;font-weight:700");
  } catch (e) {
    console.log("%cℹ️ העתק ידנית את הטקסט שמעל", "color:#9C6410;font-weight:700");
  }
})();
