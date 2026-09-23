# משימה: מיקום קבוע לטופס "שיחה עם מהנדס" – מעל ה-H2 השנייה בכל פוסט

## הקשר
- אתר: `https://www.xn----9hcbbmdejomb6a2c8b8a.org.il/` (וורדפרס, עברית, RTL).
- בכל פוסט מופיע טופס "שיחה עם מהנדס". הוא מוכנס אוטומטית דרך תוסף snippets (כנראה WPCode, לפי החוקיות "אחרי פסקה N").
- עמוד הבעיה: `https://www.xn----9hcbbmdejomb6a2c8b8a.org.il/%D7%97%D7%91%D7%99%D7%9C%D7%95%D7%AA-%D7%9C%D7%A9%D7%9C%D7%99%D7%97%D7%AA-%D7%94%D7%95%D7%93%D7%A2%D7%95%D7%AA-sms-%D7%9C%D7%A2%D7%A1%D7%A7%D7%99%D7%9D/`
- הבעיה שדווחה: בעמוד הזה הטופס נכנס באמצע קופסת "טיפ" כתומה ושובר את העיצוב.

## השערה (לאמת בשלב 0, לא עובדה)
ההכנסה נעשית לפי מספר פסקה. הטופס לא "רואה" את מבנה הפוסט, ולכן כשפסקה מספר N יושבת בתוך קופסת טיפ, טבלה או בלוק מעוצב, הטופס נכנס לתוכו. לכן שינוי מספר הפסקה לא פותר את הבעיה, רק מעביר אותה לפוסט אחר.

## ההחלטה ולמה
מבטלים את ההכנסה לפי פסקה ומכניסים את הטופס לפי מבנה: **מעל ה-H2 השנייה ברמה העליונה של הפוסט**. H2 שיושבת בתוך מיכל (div, table, figure, aside, section, blockquote, details, nav, ul, ol) לא נספרת, ולכן הטופס לעולם לא ייכנס לתוך טיפ, טבלה או תבנית אחרת. בפוסט עם פחות משתי H2 ברמה העליונה, הטופס יוצב בסוף הפוסט.
תוכן הטופס עצמו לא משתנה. הסניפט הקיים ממשיך להחזיק אותו, ורק שיטת ההכנסה שלו משתנה ל-Shortcode. כך נשמרים ה-id, ה-class וכל מעקב ההמרות.

## חוקי ברזל
1. לא לגעת ב-HTML/CSS/JS של הטופס עצמו, ולא בתוכן של אף פוסט.
2. לא למחוק את הסניפט הקיים. רק לשנות את Insert Method שלו.
3. לא לגעת ב-GTM, ב-GA4 או בתוספי cache, מלבד ניקוי cache.
4. כל שינוי נעשה בנפרד, ואחריו בדיקה.

## שלב 0 – אימות ותיעוד לפני כל שינוי (חובה)
1. פתח את עמוד הבעיה **בחלון פרטי (לא מחובר)**. ב-DevTools:
   - אתר את אלמנט הטופס ורשום את ה-id/class שלו.
   - רשום את שרשרת ההורים שלו עד מיכל התוכן (`.entry-content` או המקביל). האם אחד ההורים הוא קופסת הטיפ?
   - רשום את טקסט ה-H2 הראשונה והשנייה ברמה העליונה.
   - צלם מסך של האזור.
2. בלוח הבקרה, פתח את סניפט הטופס בתוסף. **צלם מסך מלא** ורשום: שם הסניפט, ID, סוג קוד, Insert Method, Location (למשל "After paragraph" + מספר), Auto Insert, Device, Conditional Logic, Priority, סטטוס.
3. **מיפוי תלויות:** בדוק איפה עוד הסניפט מופיע. אם ה-Location או ה-Conditional Logic כוללים גם דפים, עמודי קטגוריה או post types אחרים, **עצור ודווח**. המעבר ל-Shortcode יעלים ממקומות אלה את הטופס.
4. חפש ב-GTM טריגרים שתלויים ב-id/class של הטופס או ב-URL של הדף, ורשום אותם (לקריאה בלבד).

**תנאי עצירה לשלב 0:**
- הטופס לא מוכנס דרך תוסף snippets (למשל דרך Elementor, התבנית או functions.php): עצור ודווח מה מצאת.
- התוסף הוא לא WPCode (למשל Ad Inserter): עצור ודווח. יש להתאים את שורת `do_shortcode` בקוד.
- בחלון פרטי הטופס לא נמצא בתוך קופסת הטיפ: עצור ודווח. יכול להיות שהבעיה כבר לא קיימת או שמקורה ב-cache.

## שלב 1 – יצירת הסניפט החדש (עדיין לא פעיל)
ב-WPCode צור **PHP Snippet** חדש בשם `Engineer form – placement above 2nd H2`. הדבק את הקוד הבא, **בלי** שורת `<?php` הראשונה, והחלף את `EF_FORM_SNIPPET_ID = 0` ב-ID מסעיף 0.2. Location: **Run Everywhere**. **שמור כלא-פעיל.**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const EF_FORM_SNIPPET_ID = 0; // ← ID of the existing form snippet in WPCode.
const EF_TARGET_H2       = 2;  // Insert above the Nth top-level H2.

add_filter( 'the_content', 'ef_place_engineer_form', 20 );

function ef_place_engineer_form( $content ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	if ( ! EF_FORM_SNIPPET_ID || false !== strpos( $content, 'ef-engineer-form' ) ) {
		return $content;
	}

	$form = do_shortcode( '[wpcode id="' . (int) EF_FORM_SNIPPET_ID . '"]' );
	if ( '' === trim( $form ) ) {
		return $content;
	}
	$form = '<div class="ef-engineer-form">' . $form . '</div>';

	$offset = ef_find_insert_offset( $content );
	if ( null === $offset ) {
		return $content . $form;
	}

	return substr( $content, 0, $offset ) . $form . substr( $content, $offset );
}

function ef_find_insert_offset( $content ) {
	if ( ! preg_match_all( '/<h2\b/i', $content, $matches, PREG_OFFSET_CAPTURE ) ) {
		return null;
	}

	$count = 0;
	foreach ( $matches[0] as $match ) {
		if ( ef_is_top_level( substr( $content, 0, $match[1] ) ) && ++$count === EF_TARGET_H2 ) {
			return $match[1];
		}
	}

	return null;
}

function ef_is_top_level( $before ) {
	foreach ( array( 'div', 'aside', 'section', 'blockquote', 'figure', 'table', 'details', 'nav', 'ul', 'ol' ) as $tag ) {
		$opened = preg_match_all( '/<' . $tag . '\b/i', $before );
		$closed = preg_match_all( '/<\/' . $tag . '\s*>/i', $before );
		if ( $opened > $closed ) {
			return false;
		}
	}
	return true;
}

add_action( 'wp_head', function () {
	if ( is_singular( 'post' ) ) {
		echo '<style>.ef-engineer-form{clear:both;margin:2.5em 0}</style>';
	}
} );
```

## שלב 2 – ההחלפה (שני שינויים צמודים, בסדר הזה)
1. בסניפט הטופס הקיים: שנה את **Insert Method ל-Shortcode** ושמור. הסניפט נשאר **פעיל**, כי ה-shortcode שלו מחזיר ריק כשהוא לא פעיל.
2. הפעל את הסניפט החדש.
3. נקה את כל שכבות ה-cache: תוסף ה-cache של האתר וגם Cloudflare/CDN, אם יש.
4. רשום תאריך ושעה מדויקים של ההחלפה.

אם WPCode מציג שגיאה בשמירה או מכבה את הסניפט אוטומטית, **עצור** ובצע Rollback.

## שלב 3 – אימות (חלון פרטי, לא מחובר)
**בעמוד הבעיה:**
- ב-DevTools: `document.querySelectorAll('.ef-engineer-form').length === 1`, וגם הטופס המקורי מופיע **פעם אחת בלבד** (חפש לפי ה-id/class מסעיף 0.1).
- `document.querySelector('.ef-engineer-form').nextElementSibling` הוא ה-H2 השנייה שרשמת בסעיף 0.1.
- `document.querySelector('.ef-engineer-form').closest('table, figure, aside, blockquote, details')` מחזיר `null`, וקופסת הטיפ לא נמצאת בשרשרת ההורים.
- אם קופסת הטיפ היא `div` שיושבת לפני ה-H2 השנייה, היא שלמה ומוצגת תקין.
- הבדיקה בוצעה בדסקטופ ובמובייל (DevTools, 375px).

**בדיקה רוחבית:** בדוק עוד 3 פוסטים: אחד עם טבלה, אחד עם קופסת טיפ, ואחד קצר עם H2 אחת או בלי H2 בכלל. בכל אחד הטופס מופיע פעם אחת, מעל ה-H2 השנייה (או בסוף הפוסט אם אין שתיים), ולא בתוך מיכל.

**מעקב:** ב-GTM Preview שלח את הטופס עם הנתונים `בדיקה – לא לחזור` ו-`0500000000`, ובדוק שהטריגרים מסעיף 0.4 נורים כמו קודם. **אם אין אפשרות לבדוק ב-Preview, אל תשלח ליד אמיתי. דווח.**

## Rollback (פחות מדקה)
1. כבה את הסניפט החדש.
2. בסניפט הטופס, החזר את Insert Method, Location ומספר הפסקה לערכים שבצילום המסך מסעיף 0.2.
3. נקה cache ובדוק שהטופס חזר למקום הקודם.

**בצע Rollback מיד אם:** הטופס נעלם מפוסט כלשהו, מופיע פעמיים, מופיע בדף שאינו פוסט, או שטריגר המרה מפסיק לירות.

## ניטור אחרי השינוי (14 יום)
- צפוי: שינוי במיקום הטופס משנה את שיעור החשיפה שלו. אם ה-H2 השנייה נמצאת מוקדם יותר מפסקה N, יותר גולשים יראו את הטופס ושיעור השליחות לפוסט יעלה. אם היא מאוחרת יותר, שיעור השליחות עשוי לרדת. שינוי של עד כ-±20% בשליחות לפוסט הוא תוצאה של המיקום, לא תקלה.
- מדאיג: **אפס** שליחות בפוסטים שבעבר קיבלו שליחות, או ירידה חדה בכל הפוסטים יחד. במקרה כזה חשוד בתקלה, בדוק את שלב 3 ושקול Rollback.
- הוסף ב-GA4 annotation עם תאריך ההחלפה. השוואות של המרות לפוסט שחוצות את התאריך הזה לא מייצגות רק שינוי בתוכן.

## Definition of Done
- [ ] בעמוד הבעיה: הטופס מעל ה-H2 השנייה, מחוץ לקופסת הטיפ, מופיע פעם אחת.
- [ ] 3 פוסטים נוספים עברו את הבדיקה הרוחבית.
- [ ] מעקב ההמרות אומת ב-GTM Preview.
- [ ] צילומי מסך "לפני" ו"אחרי", ערכי ההגדרות המקוריים ותאריך ההחלפה נמסרו בדוח.

## מה לא לעשות
- לא לפתור את הבעיה בשינוי מספר הפסקה.
- לא לערוך את תוכן הפוסט, למשל להזיז או למחוק את קופסת הטיפ.
- לא להעתיק את קוד הטופס לתוך הסניפט החדש. הקוד נשאר רק בסניפט הקיים.
- לא להסתיר את הטופס עם CSS.
- לא לשלוח טפסים אמיתיים לבדיקה.
- לא לבצע באותו סבב שינויים נוספים באתר.

## דוח לסיום
החזר את כל סעיפי ה-Definition of Done עם הראיות שלהם, ודווח על כל חריגה מהפרומט ועל כל תנאי עצירה שהופעל.
