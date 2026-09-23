<?php
/**
 * Engineer-contact form placement for single posts.
 *
 * The form goes above the second top-level H2, or at the end of the post
 * if there are fewer than two. An H2 counts only if it isn't nested in a
 * container (div, table, figure, ...), so the form never lands inside a
 * tip box, table or other template block.
 *
 * Install (WPCode):
 *   - In the existing form snippet, change Insert Method to "Shortcode"
 *     (this turns off its "after paragraph N" auto-insert) and copy its ID.
 *   - Create a new PHP snippet with this file (without the opening "<?php"),
 *     set EF_FORM_SNIPPET_ID below, Location: Run Everywhere, Activate.
 */

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

/**
 * Byte offset of the H2 to insert before, or null if there is none.
 */
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

/**
 * True when every container opened in $before has been closed.
 */
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
