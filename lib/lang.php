<?php
/*
 *  Jirafeau, your web file repository
 *  Copyright (C) 2015  Jerome Jutteau <j.jutteau@gmail.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

function t($string_id)
{
    $lang_config = $GLOBALS['cfg']['lang'];
    if ($lang_config != "auto") {
        $r = t_in($string_id, $lang_config);
        if ($r === false || $r === "") {
            return "FIX ME";
        }
        return $r;
    }

    $visitor_langs = t_visitor_langs();
    foreach ($visitor_langs as $lang) {
        $r = t_in($string_id, $lang);
        if ($r === false || $r === "") {
            continue;
        } else {
            return $r;
        }
    }
    return "FIX ME";
}

function t_visitor_langs() {
    $visitor_langs = t_parse_accept_language();
    array_push($visitor_langs, "en");
    return $visitor_langs;
}

function t_parse_accept_language() {
    if (!isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
        return [];
    }
    // Example: fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5
    $langs = [];
    $cols = explode(',', $_SERVER['HTTP_ACCEPT_LANGUAGE']);
    foreach ($cols as $i => $semicols) {
        $lang = explode(';', $semicols);
        if (count($lang) === 0) {
            continue;
        }
        array_push($langs, $lang[0]);
    }
    return $langs;
}

function t_in($string_id, $lang) {
    $trans = t_get_json($lang);
    if ($trans === false) {
        return false;
    }
    if (!array_key_exists($string_id, $trans)) {
        return false;
    }
    return $trans[$string_id];
}

function t_get_raw_json($lang) {
    $filename = str_replace("-", "_", $lang);
    if (preg_match('/[^A-Za-z_\w]/', $filename)) {
        return false;
    }
    $p = JIRAFEAU_ROOT . "lib/locales/$filename.json";
    if (!file_exists($p)) {
        return false;
    }
    $json = file_get_contents($p);
    if ($json === false) {
        return false;
    }
    return $json;
}

function t_get_json($lang) {
    $raw_j = t_get_raw_json($lang);
    $array = json_decode($raw_j, true);
    if ($array === null) {
        return false;
    }
    return $array;
}

function json_lang_generator($lang) {
    $r = false;
    if ($lang === null) {
        $lang_config = $GLOBALS['cfg']['lang'];
        if ($lang_config != "auto") {
            $r = t_get_raw_json($lang_config);
        } else {
            foreach(t_visitor_langs() as $lang) {
                $r = t_get_raw_json($lang);
                if (!($r === false)) {
                    break;
                }
            }
        }
    } else {
        $r = t_get_raw_json($lang);
    }
    return $r === false ? "{}" : $r;
}
