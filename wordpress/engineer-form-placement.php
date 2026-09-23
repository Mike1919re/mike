<?php
/**
 * Engineer-contact form placement for single posts.
 *
 * Where the form goes:
 *   1. Above the H2 that starts with "חסכו כסף", if the post has one.
 *   2. Otherwise above the second top-level H2.
 *   3. Otherwise at the end of the post.
 * An H2 counts only if it isn't nested in a <div>, <aside>, <section>,
 * <blockquote> or <figure>, so the form never lands inside a tip box.
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
const EF_ANCHOR_PREFIX   = 'חסכו כסף';

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
	if ( ! preg_match_all( '/<h2\b[^>]*>(.*?)<\/h2>/is', $content, $matches, PREG_OFFSET_CAPTURE ) ) {
		return null;
	}

	$top_level = array();
	foreach ( $matches[0] as $i => $match ) {
		$offset = $match[1];
		if ( ! ef_is_top_level( substr( $content, 0, $offset ) ) ) {
			continue;
		}

		$text = trim( html_entity_decode( wp_strip_all_tags( $matches[1][ $i ][0] ), ENT_QUOTES, 'UTF-8' ) );
		if ( 0 === strpos( $text, EF_ANCHOR_PREFIX ) ) {
			return $offset;
		}
		$top_level[] = $offset;
	}

	return isset( $top_level[1] ) ? $top_level[1] : null;
}

/**
 * True when every container opened in $before has been closed.
 */
function ef_is_top_level( $before ) {
	foreach ( array( 'div', 'aside', 'section', 'blockquote', 'figure' ) as $tag ) {
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
