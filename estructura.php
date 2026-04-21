<?php

session_start();
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
ini_set('default_charset', 'UTF-8');
// PHP al principio del archivo, antes de cualquier HTML
// 1. Deshabilitar caché para HTTP 1.0 (para navegadores y proxies antiguos)
header("Expires: Tue, 01 Jan 2000 00:00:00 GMT"); // Fecha en el pasado
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); // Siempre la fecha actual
// 2. Deshabilitar caché para HTTP 1.1 (para navegadores y proxies modernos)
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false); // Para IE
header("Pragma: no-cache"); // Para compatibilidad con HTTP 1.0
include_once "../web/varias/funciones_comunes.php";
include_once("../web/varias/unzip.php");
include_once(dirname(__FILE__) . "/../../rotator_masters/masters.php");


// -------------------------------------------------------------------------------------------------------------------------------------
$version = '6.69';
// -------------------------------------------------------------------------------------------------------------------------------------



// $sessionPath = ini_get('session.save_path');
// $sessionFiles = glob("$sessionPath/sess_*");
// $activeSessionCount = count($sessionFiles);	


$sessionPath = ini_get('session.save_path');
$sessionFiles = glob("$sessionPath/sess_*");
$activeSessionCount = 0;
$maxLifetime = ini_get('session.gc_maxlifetime');

foreach ($sessionFiles as $file) {
    if (filemtime($file) + $maxLifetime > time()) {
        $activeSessionCount++;
    }
}

switch ($GLOBALS['master_size_of_server']) {

    case 'ULTRA-LARGE':
        if ($activeSessionCount < 1500) {
            $activeSessionColor = 'white';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/390/390973.png'; //ok verde
        } else {
            $activeSessionColor = 'red';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';// rojo
        }
        break;
    case 'LARGE':
        if ($activeSessionCount < 800) {
            $activeSessionColor = 'white';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/390/390973.png'; //ok verde
        } else {
            $activeSessionColor = 'red';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';// rojo
        }
        break;

    case 'MEDIUM':
        if ($activeSessionCount < 500) {
            $activeSessionColor = 'white';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/390/390973.png'; //ok verde
        } else {
            $activeSessionColor = 'red';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';// rojo
        }
        break;

    default:
        if ($activeSessionCount < 100) {
            $activeSessionColor = 'white';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/390/390973.png'; //ok verde
        } else {
            $activeSessionColor = 'red';
            $activeSessionImg = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';// rojo
        }
        break;

}












$MaxDiskAllowedGB = 75;



// AQUI INSERTAREMOS LAS IPS QUE PERMITEN ACCESO VIP

$IP_Auto_CHACAO = "161.22.33.249";
$IP_Auto_CHACAO_ABA = "190.201.197.79";

$IP_Auto_PARAISO = "190.204.152.215";
$IP_Auto_USA = "000.99.99.99";





// 	DETERMINA SI ES NUBE O PRIVADO - $GLOBALS['master_type_of_server']    
//    #    SET TYPE_OF_SERVER=0 (CLOUD) 	IF THIS A ROTATOR CLOUD SERVER 		     (ADMINISTERED, AND MONITORED BY ROTATOR)
//    #    SET TYPE_OF_SERVER=1 (PRIVATE)	IF THIS A ROTATOR PRIVATE SERVER	     (ADMINISTERED, AND MONITORED BY ROTATOR)
//    #    SET TYPE_OF_SERVER=2 (OWN)		IF THIS YOUR PARTICULAR PRIVATE SERVER 	     (NOT ADMINISTERED, NOT MONITORED BY ROTATOR)
//    #    SET TYPE_OF_SERVER=3 (POOL)	IF THIS SERVER IS SHARED BY A POOL OF USERS  (ADMINISTERED, AND MONITORED BY ROTATOR)



switch ($GLOBALS['master_type_of_server']) {
    case '0':
        $tipoDeServer = 'ROTATOR CLOUD';
        break;
    case '1':
        $tipoDeServer = 'PRIVATE';
        break;
    case '2':
        $tipoDeServer = 'OWN';
        break;
    case '3':
        $tipoDeServer = 'POOL';
        break;
    default:
        $tipoDeServer = 'UNDEFINED ???????????????????????????';
}


$carpetaDeEstudioPosible = ['vertea', 'versta', 'verpro', 'verind', 'verent', 'veremp', 'verdon', 'veracp', 'veracm', 'private'];
$NoEstudios_totales = 0;
$NoEstudios_mobile = 0;
$EstudiosTocados = 0;



$Ip = getClientIp();

$host = $_SERVER['HTTP_HOST'];
$subdominio = explode(".", $host);
$NombreServidor = strtoupper($subdominio[0]);
$Sospechosos = 0;
$Infectados = 0;
$CacheDeFilesPHP = 0;
$CarpetasAlteradas = 0;
$charSetEnHtcacsessAlterado = false;

$imagenbuena = "'height: 25px; width: 25px;' src='https://cdn-icons-png.flaticon.com/512/390/390973.png'";
$imagenmala = "'height: 25px; width: 25px;' src='https://cdn-icons-png.flaticon.com/512/594/594864.png'";

$MySQLActivo = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
$MySQExistenTablas = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';



$colorBD = 'yellow';
$colorTablas = 'yellow';



$CurlActivo = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
$GeoActivo = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
$colorCurl = 'yellow';
$colorGeo = 'yellow';


if (file_exists("../favicon.ico")) {
    $FavIcon = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
    $FavIconColor = 'white';
} else {
    $FavIcon = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
    $FavIconColor = 'red';
}







$clave = '';
$usuario = '';
$disco = 0;
$discoImg = '';

$AcumFilesTocados_Count = 0;
$AcumFilesTocados_Bytes = 0;

// TESTS PARA BUSCAR ARCHIVOS QUE NO SON DE ROTATOR
function show_files($start)
{

    global $Sospechosos, $Infectados, $CarpetasAlteradas, $disco, $discoImg, $carpetaDeEstudioPosible, $NoEstudios_totales, $NoEstudios_mobile, $AcumFilesTocados_Bytes, $AcumFilesTocados_Count, $EstudiosTocados;

    $discoImg = "<div class='loader'></div>";
    $contents = scandir($start);
    array_splice($contents, 0, 2);
    echo "<ul>";
    $contFiles = 0;
    $tamanoFile = 0;



    foreach ($contents as $item) {
        $contFiles++;
        $fullPath = "$start/$item";
        $tamanoFile = filesize($fullPath);



        // ULTIMAS 2 HORAS
        if (filemtime($fullPath) >= time() - 7200) {
            $AcumFilesTocados_Count++;
            $AcumFilesTocados_Bytes += $tamanoFile;
        }


        $disco += $tamanoFile;
        // $contFiles++;


        if (
            (substr($item, -3) == ".js" or
                substr($item, -4) == ".php" or
                substr($item, -4) == ".txt" or
                substr($item, -9) == ".htaccess" or
                substr($item, -5) == ".htc_" or
                substr($item, -5) == ".html" or
                substr($item, -4) == ".htm") &&
            ($item != "estructura.php" && $item != "cawi_monitor.php")
        ) {
            // excluye estos arcvhivos porque alli adentro tambien etsteo estos caracteres

            $hayVirus = false;
            $leo = file_get_contents($fullPath);

            // AGREGADOS 1ER ATAQUE
            if (stripos($leo, "Sitemap:http:") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'function echo_json($') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "===undefined){function") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "+'Of'](") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, ")+-parseInt(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "['push'](") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "['shift']())") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "']());}}}(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "if(ndsw===undefined){") != false) {
                $hayVirus = true;
            }

            // AGREGADOS EN 2DO ATAQUE 02 11 2022
            if (stripos($leo, ";if(nds") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "token=function(){return") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "*(-parseInt(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "urlencode(base64_encode(json_encode(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "if (is_callable(") != false) {
                $hayVirus = true;
            }

            // AGREGADOS EN 3R ATAQUE 10 12 2022
            if (stripos($leo, "function mode()") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "= $_COOKIE;") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "return self::$") != false) {
                $hayVirus = true;
            }


            // -----------------------------------------------------------------------------------------------------
            // BUSCA LA MARCA DE FIN DE ARCHIVO: RotatorEOFforMalwareDetect
            // -----------------------------------------------------------------------------------------------------
            $faltaMarcaRotator = false;

            switch ($item) {
                case "funciones_comunes.js":
                case "funciones_comunes.php":
                case "download.js":
                case "compartido.js":
                case "sesiones.js":
                    if (stripos(substr($leo, -35), "RotatorEOFforMalwareDetect") == false) {
                        $faltaMarcaRotator = true;
                    }
                    break;
            }


            // AQUI CADENAS DE ARCHIVOS ENCONTRADOS EN 3R ATAQUE
            if (stripos($leo, 'Jackpot') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'POWERGAMING') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'Game Online') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'google-site-verification') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'h=h[d]=h[d]||{q:[]') != false) {
                $hayVirus = true;
            }

            if (stripos($leo, 'product:price:amount') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'Hey siriusly') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'product-preview__glider') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'TeePublic.Utility.unveil_image') != false) {
                $hayVirus = true;
            }





            // -----------------------------------------------------------------------------------------------------
            // AQUI TROZOS DE CODIGOS DE VIRUS QUE HE ECONTRADO EN STACKOVERFLOW
            if (stripos($leo, "$_REQUEST\[") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '$license($') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, ".send()}}(window);") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "instanceof Array)){") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '"undefined"!=typeof Symbol') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "eval(function(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'function packToHex($inputToPack)') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'function fun3($exploded)') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '$bitwiseXor') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'eval(base64_decode("') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "eval(base64_decode('") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "eval(base64_decode(str_replace(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '@$_SERVER["HTTP_HOST"].@$_SERVER["REQUEST_URI"];') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '=openssl_decrypt($') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '){global $_') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "(){window[") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "= new Date();var") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "){return null};var") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "=function(){return'\\") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "=true;break;case") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "(sys_get_temp_dir(),time());if(file_put_contents($") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, ", NULL); $") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "]); } return $") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, ")); if (!function_exists('") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "; if (!function_exists('") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "=explode(chr((") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "){return chr(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "'openssl_private_decrypt','openssl_decrypt',") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, ";if(navigator[appVersion_var].indexOf(") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'var appVersion_var="') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '\x63\x65";function') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, 'window[unescape("') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '($GLOBALS["') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '=["\x') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, ',$$_:') != false) {
                $hayVirus = true;
            }
            if (stripos($leo, '_$$:') != false) {
                $hayVirus = true;
            }

            // DESCUBIERTO EN ARTEMIS ESTUDIO DE ALEXANDRE BR RADAR
            if (stripos($leo, "'send','inde'") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "+'tr'](") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "=new HttpClient(),") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, ")!==-0") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "=screen,") != false) {
                $hayVirus = true;
            }
            if (stripos($leo, "='+token();") != false) {
                $hayVirus = true;
            }

            // SI ES UN .HTCACCESS QUE NO ES DE ROTATOR
            if (stripos($item, "htaccess") != false && trim($leo) != "" && stripos($leo, "_docs/trigger_wait.php") == false) {


                if (stripos($leo, "ROTATORSOFTWARE") == false) {
                    $hayVirus = true;
                }

                $MARCA_VERSION_HTACESS = "HTACESS BASE"; // HTACESS BASE PARA TODOS LOS SERVIDORES DE LA NUBE VERSION 1.1

                if (!isset($versionHtaccess)) {
                    if (stripos($leo, $MARCA_VERSION_HTACESS) != false) {
                        preg_match('/VERSION (\d+\.\d+)/', $leo, $matches);// copilot: This code uses a regular expression to find the pattern "VERSION x.x" in the string and captures the version number.
                        $versionHtaccess = $matches[1];
                    }
                }







                if ($start == '../') {// revisa htcacess de public
                    if (stripos($leo, 'php_value default_charset "UTF-8"') == false) {// 31 10 2025
                        $charSetEnHtcacsessAlterado = true;
                    }
                }

            }

            if ($hayVirus) {
                echo "<li style='color:red;'><b>" . "Possible malware  was detected in " . $item . "!!!</b></li>";
                $Infectados++;
            } else {
                if ($faltaMarcaRotator) {
                    echo "<li style='color:blue;'><b>" . "Rotator watermark not found, possibly and old Modeler was used? in " . $item . "!!!</b></li>";

                    $Sospechosos++;

                } elseif ($charSetEnHtcacsessAlterado) {
                    echo "<li style='color:red;'><b>Public htcaccess modified: The setting php_value default_charset=UTF-8 was not found " . $item . "!</b></li>";
                    $charSetEnHtcacsessAlterado = false;
                    $Sospechosos++;
                }
            }
        }







        if (is_dir($fullPath) && in_array(basename(dirname($fullPath)), $carpetaDeEstudioPosible)) {
            if (strpos($fullPath, '_docs') === false && strpos($fullPath, 'shr_') === false) {

                $NoEstudios_totales++;
                if (strpos($fullPath, 'off_') !== false) {
                    $NoEstudios_mobile++;

                }
            }
        }




        if (is_dir($fullPath) && substr($item, 0, 1) != ".") {
            switch ($item) {

                // ELIMINAR BORRAR DIC 2026 PUES FUE MIGRADO A VERSION 3.3
                case "PhpSpreadsheet":
                    if (folderSize($fullPath) != 5859582) {
                        echo '<li style="color:red;"><b>' . $item . " (Modified folder) </b></li>";
                        $CarpetasAlteradas++;
                    }
                    break;
                // ELIMINAR BORRAR DIC 2026 PUES FUE MIGRADO A VERSION 3.3

                case "jquery-ui.min-v1.14.0-sin-slider":
                    if (folderSize($fullPath) != 259555) {
                        echo '<li style="color:red;"><b>' . $item . " (Modified folder) </b></li>";
                        $CarpetasAlteradas++;
                    }

                    break;

                case "PhpSpreadsheet-v3.3":
                    if (folderSize($fullPath) != 13125118) {
                        echo '<li style="color:red;"><b>' . $item . " (Modified folder) </b></li>";
                        $CarpetasAlteradas++;
                    }
                    break;

                case "phpqrcode":
                    if (folderSize($fullPath) != 420420) {
                        echo '<li style="color:red;"><b>' . $item . " (Modified folder) </b></li>";
                        $CarpetasAlteradas++;
                    }
                    break;
                case "fpdf":
                    if (folderSize($fullPath) != 450348) {
                        echo '<li style="color:red;"><b>' .
                            $item . " (Modified folder) </b></li>";
                        $CarpetasAlteradas++;
                    }
                    break;

                default:
                    switch ($item) {
                        case "cacheShortLink":
                        case "audios_importados":
                        case "clonar":
                        case "web":
                        case "CUARENTENA":
                        case "RESPALDOS":
                        case "web_BACKUPS_ult_cinco_dias":
                        case "tablet":
                        case "web":
                        case "tests":
                        case "ejemplos":
                        case "framework7":
                        case "f7":
                        case "assets": // de framework7
                        case "fonts": // de framework7
                        case "icons": // de framework7
                        case "private":
                        case "varias":
                        case "veracm":
                        case "veracp":
                        case "verdon":
                        case "veremp":
                        case "verent":
                        case "verind":
                        case "verpro":
                        case "versta":
                        case "vertea":
                        case "css":
                        case "imagenes":
                        case "jquery":
                        case "jquery-confirm":
                        case "js":
                        case "jsignature":
                        case "mascaras":
                        case "email-autocomplete":
                        case "framework7":
                        case "ejemplos":
                        case "varias":
                        case "en":
                        case "es":
                        case "po":
                        case "fr":
                        case "GoogleMapsMarkers":
                        case "TagCloud":
                        case "ejemplo_CAWI":
                        case "estrellas":
                        case "fav-icons":
                        case "jquery-timepicker":
                        case "mails":
                        case "maska-master-v1.1.4":
                        case "maska-master-v1.4.1":
                        case "materializecss-v1.0.0":
                        case "numeral":
                        case "rateYo_ver232":
                        case "estrellas":
                        case "splashAndroid":
                        case "iconosAndroid":
                        case "mobile_145":
                        case "dist":
                        case "docs":
                        case "src":
                        case "test":
                        case "types":
                        case "Imgs_QR_temp":
                        case "images":
                        case "es6":
                        case "icons-png":
                        case "icons-svg":
                        case "cgi-bin":
                        case "capi":
                        case "mobile":
                        case "mobile_capi":
                        case "UrlShort":

                        case "api":


                            echo "<li>$item</li>";
                            show_files($fullPath);
                            break;
                        default:
                            $EstaOK = 0; // DETECTA SI TERMINA EN _1
                            switch (substr($item, -2)) {
                                case "_1":
                                case "_2":
                                case "_3":
                                case "_4":
                                case "_5":
                                case "_6":
                                case "_7":
                                case "_8":
                                case "_9":
                                    $EstaOK = 1;
                                    break;
                            }
                            if (is_numeric(substr($item, -2))) {
                                $EstaOK = 1;
                            }
                            if (substr($item, -5) == "_docs") {
                                $EstaOK = 1;
                            }
                            if (strpos($start, "audios_importados") > 0) {
                                $EstaOK = 1;
                            }
                            if ($EstaOK == 1) {

                                if (file_exists($fullPath . '/actividad.txt') && date('Y-m-d', filemtime($fullPath . '/actividad.txt')) === date('Y-m-d')) {
                                    $EstudiosTocados++;

                                    echo "<li style='color:blue;'>$item</li>";
                                } else {
                                    echo "<li style='color:gray;'>$item</li>";
                                }




                                show_files($fullPath);
                            } else {
                                echo "<li style='color:red;'><b>" . $start . " / " . $item . " (Unrecognized folder)" . "</b></li>";
                                $Sospechosos++;
                            }
                    }
            }
        } else {
            // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            if (substr($item, -3) == ".png" or substr($item, -4) == ".jpg") {
                $size = getimagesize($fullPath);
                switch ($size["mime"]) {
                    case "image/gif": // echo "Image is a gif";
                    case "image/jpeg": // echo "Image is a jpeg";
                    case "image/png": // echo "Image is a png";
                    case "image/bmp": // echo "Image is a bmp";
                    case "image/webp": // echo "Image is a .webp";
                        break;
                    default:
                        if (filesize($fullPath) === 0) {
                            unlink($fullPath);
                        } else {
                            echo "<li style='color:red;'><b>$item</b></li>";
                            $Infectados++;
                        }
                }

                $EsCarpetaDeEstudios = false;

                if (strpos($start, "/private/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/veracm/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/veracp/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/verdon/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/veremp/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/verent/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/verind/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/verpro/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/versta/") == false) {
                    $EsCarpetaDeEstudios = true;
                }
                if (strpos($start, "/vertea/") == false) {
                    $EsCarpetaDeEstudios = true;
                }





                if ($EsCarpetaDeEstudios == false) {
                    switch ($item) {
                        case "felicita.jpg":
                        case "login.jpg":
                        case "new.jpg":
                        case "ping.jpg":
                        case "postergar.jpg":
                        case "postergar_list.jpg":
                        case "remove.jpg":
                        case "silueta.jpg":
                        case "stop.jpg":
                        case "survey.jpg":
                        case "surveySinDescargar.jpg":
                        case "tablet_mic_on.jpg":
                        case "trash2.jpg":
                        case "varita.jpg":
                        case "instructivo_1.jpg":
                        case "instructivo_2.jpg":
                        case "instructivo_3.jpg":
                            break;
                        default:
                            echo "<li style='color:red;'><b>" . $start . "/" . $item . "</b></li>";
                            $Infectados++;
                    }
                }
            }
            // --------------------------------------------------------------------------------------------------------------------------------------------------------------------------



            if ($item == "error_log") {
                if (filesize($start . "/" . "error_log") > 500000) {
                    echo "<li style='color:red;'><b>" . $item . " (Too large !!!)" . "</b></li>";
                    $Sospechosos++;
                }
            }
            if (substr($item, -4) == ".php" or substr($item, -5) == ".htc_") {

                switch (strtolower($item)) {
                    case "index.php":
                        $fh = fopen($start . "/" . "index.php", "r");
                        $linea = fgets($fh);
                        if (strpos($linea, "ROTATOR") == false) {
                            echo "<li style='color:red;'><b>" . $item . " (Modified !!!)" . "</b></li>";
                            $Sospechosos++;
                        }
                        fclose($fh);
                        break;



                    case "ai_pregunta_deepseek-v3.php":



                    case "capiwebmenu.php":
                    case "loginopermobile.php":
                    case "ai_pregunta_gemini.php":
                    case "ajax_asignatfsel.php":
                    case "ajax_dameconteosstatusdata.php":
                    case "ajax_damedatosdeauditoria.php":
                    case "ajax_damegeolocadecaso.php":
                    case "ajax_dameconteosstatusqA.php":
                    case "ajax_damedatasegunstatus.php":
                    case "ajax_damevectorinfogeo.php":
                    case "ajax_mataestosstatus.php":
                    case "ajax_dameconteosstatusqa.php":
                    case "ajax_anularcasodesdemapa.php":
                    case "mataestosstatus.php":
                    case "test.php":
                    case "admin.php":
                    case "ajax_grabaciones_damearchivos.php":
                    case "ajax_asignaqa.php":
                    case "ajax_usr_session_logear.php":
                    case "ajax_usr_session_matar.php":
                    case "ajax_consolidasents.php":
                    case "ajax_usr_session_matar":
                    case "ajax_usr_session_logear":
                    case "ajaxtraducciongenerarjs.php":
                    case "colocacandadoaestecaso.php":
                    case "grabaciones_matarfiles.php":
                    case "remuevecandadoaestecaso.php":
                    case "tienecandadoestecaso.php":
                    case "ajax_consolidasentsmetodo2.php":
                    case "ajax_pausar.php":
                    case "ajax_poblar_opers_online.php":
                    case "ajax_dame_datasegunstatus.php":
                    case "ajax_dame_vectorinfo_geo.php":
                    case "ajax_poblar_opers_offline.php":
                    case "ajax_receivedata.php":
                    case "ajax_recordarcorreopostergado.php":
                    case "ajax_recuperadatossihabiaabandonado.php":
                    case "ajax_rejustafechaposterga.php":
                    case "analyzer.php":
                    case "anulaestecaso.php":
                    case "arcapse.php":
                    case "arcsase.php":
                    case "arcspaaase.php":
                    case "arcsspse.php":
                    case "arlpse.php":
                    case "arlsaase.php":
                    case "arlsasse.php":
                    case "arlsspase.php":
                    case "arlsssaaase.php":
                    case "arpase.php":
                    case "arsaaase.php":
                    case "arscpaase.php":
                    case "arscse.php":
                    case "arslase.php":
                    case "arslpaaase.php":
                    case "arsspaase.php":
                    case "arsssapse.php":
                    case "arssse.php":
                    case "be98ce84d74f8d422bc55fc7a7dd55df_1":
                    case "bebc4fe418f8d25c5c0a1cfe1192d36a_1":
                    case "calligra.php":
                    case "cargamanual.php":
                    case "cati_esteidestaencursooyahecho.php":
                    case "cati_revisaen_in_process_file_siestecasolollevaotrooperador.php":
                    // eliminar borrar enero 2027
                    case "cati_casoloatiendeotrooper.php":
                    // eliminar borrar enero 2027
                    case "cati_casoloatiendeotrooperador.php":
                    case "cawi_ajax_unzip.php":
                    case "cawi_descarga.php":
                    case "cawi_mataerrorlog.php":
                    case "cawi_monitor.php":
                    case "cawi_monitor_mataestudio.php":
                    case "cawi_monitor_remuevesolodebd.php":
                    case "cawi_monitor_zipeaestudio.php":

                    case "ajax_chism.php":


                    // eliminar borrar enero 2027
                    case "chismear.php":
                    case "ajax_chismear.php":
                    // eliminar borrar enero 2027                       


                    case "ajax_chism.php":
                    case "ajax_tabladecuotas.php":
                    case "ajaxcheck.php":
                    case "testsfor247":
                    case "mailtest.php":


                    case "largeposttest_part1.html":
                    case "largeposttest_part2.php":



                    case "phpsessionstest_page1.php":
                    case "phpsessionstest_page2.php":
                    case "test_database_connection.php":
                    case "clonar":
                    case "clonar.php":
                    case "code128.php":
                    case "comun_monitoreo.php":
                    case "confirmacasosllegaron.php":
                    case "cuantosestudiosfrescos.php":
                    case "cuantosestudioshapublicado.php":

                    // ELIMINAR BORRAR ENERO 2030
                    case "cuotas_damediferencia.php":
                    // ELIMINAR BORRAR ENERO 2030

                    case "ajax_damediferenciascuotasparamovil.php":



                    case "cuenta_casos.php":
                    case "damearraymodsconteodata.php":
                    case "damecodigosqrdeequipohumano.php":
                    case "dameconteosstatus.php":
                    case "dameconteosvarscontrol.php":
                    case "damedisparos_bdp.php":
                    case "dameqrfichaequipo.php":
                    // eliminar borrar enero 2027
                    case "dametabladecuotas.php":
                    case "damedisparos.php":
                    // eliminar borrar enero 2027
                    case "dataweb_damedatadestickers.php":
                    case "dataweb_damedatadevercasos.php":
                    case "dataweb_dametextosdenubedepalabras.php":
                    case "datawebfiltradata.php":
                    case "delete.php":
                    case "enviacorredesdeclienteviaajax.php":
                    case "filtrar_audio.php":
                    case "font":
                    case "forzastatusdeids.php":
                    case "funciones_cawi.php":
                    case "funciones_comunes.php":
                    case "funciones_gerals.php":
                    case "googlemapsmarkers":
                    case "cawi_genera_disparosmaxdif.php":
                    case "grabaciones_borraarchivo.php":
                    case "grabaciones_damearchivos.php":


                    // ELIMINAR BORRAR ENERO 2027
                    case "grabaciones_damefechasdearchivos.php":
                    // ELIMINAR BORRAR ENERO 2027

                    case "grabaciones_damefechas_y_operadores.php":

                    case "grabaciones_zipfiles.php":
                    case "inboundsearch.php":
                    case "inicio.php":
                    case "info.php":
                    case "integradatosoffline.php":
                    case "listarestudiosparavb6.php":
                    case "login.php":
                    case "logindigitador.php":
                    case "loginoperadortf.php":
                    case "loginsupervisor.php":
                    case "mail_condicion.php":
                    case "mail_error.php":
                    case "mail_generico.php":
                    case "mail_reclamo.php":
                    case "mails":
                    case "ajaxmailtest.php":
                    case "makefont":
                    case "makefont.php":
                    case "manejaarchivossubidos.php":
                    case "mataestosids.php":
                    case "matarwebysentdeusr.php":
                    case "matasessionlogon.php":
                    case "maxdif_dameconteosatributos.php":
                    case "menu.php":
                    case "monitoreo_opers.php":
                    case "murder.php":
                    case "murder_en.php":
                    case "murder_es.php":
                    case "murder_fr.php":
                    case "murder_pt.php":
                    case "navbartestadmin.php":
                    case "noaabo.php":
                    case "noasbo.php":
                    case "nocbo.php":
                    case "nocpaabo.php":
                    case "nocsapbo.php":
                    case "nocssabo.php":
                    case "nodata.php":
                    case "nocase.php":
                    case "nocaseabandoned.php":
                    case "nolabo.php":
                    case "nolpaaabo.php":
                    case "nolspbo.php":
                    case "nolssaabo.php":
                    case "nolssasbo.php":
                    case "nolssspabo.php":
                    case "noscaaabo.php":
                    case "noslapbo.php":
                    case "nospabo.php":
                    case "nossaaabo.php":
                    case "nosssbo.php":
                    case "nossspaabo.php":
                    case "nubeborrar.php":
                    case "nubecorreosexpirados.php":
                    case "numeral":
                    case "operadorgrabaversion.php":
                    case "paapte.php":
                    case "pacaate.php":
                    case "pacaste.php":
                    case "pacspate.php":
                    case "pacssaaate.php":
                    case "palaaate.php":
                    case "palspaate.php":
                    case "palssapte.php":
                    case "palsssate.php":
                    case "palssspaaate.php":
                    case "palste.php":
                    case "pasate.php":
                    case "pascpte.php":
                    case "paslpate.php":
                    case "paspaaate.php":
                    case "passpte.php":
                    case "passsaate.php":
                    case "passsaste.php":
                    case "perfil.php":
                    case "perfildatasujeto.php":

                    // eliminar borrar enero 2028
                    case "php_inyecta_tblbarridodebdp.php":
                    // eliminar borrar enero 2028

                    case "ajax_inyecta_tblbarridodebdp.php":


                    case "phpinfo.php":
                    case "ajaxcheckserver.php":
                    case "ping.php":
                    case "prcaaasa.php":
                    case "prcspaasa.php":
                    case "prcssa.php":
                    case "prcssapsa.php":
                    case "prlapsa.php":
                    case "prlsasa.php":
                    case "prlspaaasa.php":
                    case "prlsspsa.php":
                    case "prlsssaasa.php":
                    case "prlsssassa.php":
                    case "prpsa.php":
                    case "prsaasa.php":
                    case "prsassa.php":
                    case "prscpasa.php":
                    case "prslpaasa.php":
                    case "prslsa.php":
                    case "prsspasa.php":
                    case "prsssaaasa.php":
                    case "pseudo_cronjob.php":
                    case "pueblalocalstorageconvarsde_bdps.php":
                    case "pueblalocalstorageconvarsdesession.php":
                    case "rateyo_ver232":
                    case "reasignaestosids.php":
                    case "recibe_data_offline.php":
                    case "requiredchars.php":
                    case "results.php":
                    case "secpra.php":
                    case "secsaara.php":
                    case "secsasra.php":
                    case "selpara.php":
                    case "selsaaara.php":
                    case "selsspaara.php":
                    case "selssra.php":
                    case "selsssapra.php":
                    case "sepaara.php":
                    case "servidor_dameinfosobreesteestudio.php":
                    case "sesapra.php":
                    case "sescara.php":
                    case "sescpaaara.php":
                    case "seslaara.php":
                    case "seslasra.php":
                    case "sessara.php":
                    case "sesspaaara.php":
                    case "sessspra.php":
                    case "sianu.php":
                    case "sicpanu.php":
                    case "sicsaaanu.php":
                    case "sicssnu.php":
                    case "silnu.php":
                    case "silpaanu.php":
                    case "silsapnu.php":
                    case "silssanu.php":
                    case "silsspaaanu.php":
                    case "silssspnu.php":
                    case "sipaaanu.php":
                    case "siscaanu.php":
                    case "siscasnu.php":
                    case "sislaaanu.php":
                    case "sispnu.php":
                    case "sissaanu.php":
                    case "sissasnu.php":
                    case "sissspanu.php":
                    case "src":
                    case "stickers.php":
                    case "stop.php":
                    case "generarshortlink.php":
                    case "damedetalledeotro.php":
                    case "redireccionarshortlink.php":
                    case "symbol.php":
                    case "tablet":
                    case "tagcloud":
                    case "team_certify.php":
                    case "telefonicawebmenu.php":
                    case "terminate.php":
                    case "servertime.php":
                    case "estructura.php":
                    case "testlinuxcommands.php":
                    case "tiposervidor.php":
                    case "transformadatacsv.php":
                    case "trigger.php":
                    case "trigger_analysis.php":
                    case "trigger_share_datos.php":
                    case "trigger_wait.php":
                    case "unaaapi.php":
                    case "uncapi.php":
                    case "uncpaaapi.php":
                    case "uncsppi.php":
                    case "uncssaapi.php":
                    case "unlaapi.php":
                    case "unlaspi.php":
                    case "unlspapi.php":
                    case "unlssaaapi.php":
                    case "unlssspaapi.php":
                    case "unlssspi.php":
                    case "unscappi.php":
                    case "unslppi.php":
                    case "unspaapi.php":
                    case "unspi.php":
                    case "unssappi.php":
                    case "unsssapi.php":
                    case "unssspaaapi.php":
                    case "unzip.php":
                    case "visualizarcasos.php":
                    case "wordcloud.php":
                    case "zipea_data.php":
                    case "estructura.php":
                    case "mailcomuntest.php":
                    case "testmemory.php":
                    case "genera_status_bdp.php":
                    case "cargamanual_supervisor.php":
                    case "dataweb_dameregistros.php":
                    case "dame_bdp_paraesteusr_offline.php":
                    case "dataentrywebmenu.php":
                    case "start.php":
                    case "dameqr.php":
                    case "kiosco.php":
                    case "loginsupervkiosco.php":
                    case "multipag.php":
                    case "damearraychorizos.php":
                    case "ajax_validaloginpasswordparticipante.php":
                    case "arccaase.php":
                    case "arccasse.php":
                    case "arccclpase.php":
                    case "arccclsaaase.php":
                    case "arccclsspaase.php":
                    case "arccclsssapse.php":
                    case "arccclssse.php":
                    case "arcccpaase.php":
                    case "arcccsapse.php":
                    case "arcccse.php":
                    case "arcccslaase.php":
                    case "arcccslasse.php":
                    case "arcccssase.php":
                    case "arcccsspaaase.php":
                    case "arcccssspse.php":
                    case "arcclase.php":
                    case "arcclpaaase.php":
                    case "arcclspse.php":
                    case "arcclssaase.php":
                    case "arcclssasse.php":
                    case "arcclssspase.php":
                    case "arccscaaase.php":
                    case "arccslapse.php":
                    case "arccspase.php":
                    case "arccssaaase.php":
                    case "arccssspaase.php":
                    case "arccsssse.php":
                    case "arclaaase.php":
                    case "arclspaase.php":
                    case "arclssapse.php":
                    case "arclsse.php":
                    case "arclsssase.php":
                    case "arclssspaaase.php":
                    case "arcscpse.php":
                    case "arcslpase.php":
                    case "arcsssaase.php":
                    case "arcsssasse.php":
                    case "nocccaaabo.php":
                    case "noccclaabo.php":
                    case "noccclasbo.php":
                    case "noccclspabo.php":
                    case "noccclssaaabo.php":
                    case "noccclsssbo.php":
                    case "noccclssspaabo.php":
                    case "nocccsbo.php":
                    case "nocccslpbo.php":
                    case "nocccspaabo.php":
                    case "nocccssapbo.php":
                    case "nocccsssabo.php":
                    case "nocccssspaaabo.php":
                    case "nocclapbo.php":
                    case "nocclsabo.php":
                    case "nocclspaaabo.php":
                    case "nocclsspbo.php":
                    case "nocclsssaabo.php":
                    case "nocclsssasbo.php":
                    case "noccpbo.php":
                    case "noccsaabo.php":
                    case "noccsasbo.php":
                    case "noccscpabo.php":
                    case "noccslbo.php":
                    case "noccslpaabo.php":
                    case "noccsspabo.php":
                    case "noccsssaaabo.php":
                    case "noclpabo.php":
                    case "noclsaaabo.php":
                    case "noclssbo.php":
                    case "noclsspaabo.php":
                    case "noclsssapbo.php":
                    case "nocscabo.php":
                    case "nocscpaaabo.php":
                    case "nocslaabo.php":
                    case "nocslasbo.php":
                    case "nocsspaaabo.php":
                    case "nocssspbo.php":
                    case "paccclapte.php":
                    case "paccclsate.php":
                    case "paccclspaaate.php":
                    case "paccclsspte.php":
                    case "paccclsssaate.php":
                    case "paccclsssaste.php":
                    case "pacccpte.php":
                    case "pacccsaate.php":
                    case "pacccsaste.php":
                    case "pacccslpaate.php":
                    case "pacccslte.php":
                    case "pacccsspate.php":
                    case "pacccsssaaate.php":
                    case "pacclpate.php":
                    case "pacclsaaate.php":
                    case "pacclsspaate.php":
                    case "pacclsssapte.php":
                    case "pacclsste.php":
                    case "paccpaate.php":
                    case "paccsapte.php":
                    case "paccscate.php":
                    case "paccscpaaate.php":
                    case "paccslaate.php":
                    case "paccslaste.php":
                    case "paccssate.php":
                    case "paccsspaaate.php":
                    case "paccssspte.php":
                    case "paccte.php":
                    case "paclate.php":
                    case "paclpaaate.php":
                    case "paclspte.php":
                    case "paclssaate.php":
                    case "paclssaste.php":
                    case "paclssspate.php":
                    case "pacscaaate.php":
                    case "pacslapte.php":
                    case "pacssspaate.php":
                    case "pacssste.php":
                    case "prccasa.php":
                    case "prccclpsa.php":
                    case "prccclsaasa.php":
                    case "prccclsassa.php":
                    case "prccclsspasa.php":
                    case "prccclsssaaasa.php":
                    case "prcccpasa.php":
                    case "prcccsaaasa.php":
                    case "prcccscsa.php":
                    case "prcccslasa.php":
                    case "prcccslpaaasa.php":
                    case "prcccsspaasa.php":
                    case "prcccsssa.php":
                    case "prcccsssapsa.php":
                    case "prcclpaasa.php":
                    case "prcclsa.php":
                    case "prcclsapsa.php":
                    case "prcclssasa.php":
                    case "prcclsspaaasa.php":
                    case "prcclssspsa.php":
                    case "prccpaaasa.php":
                    case "prccscaasa.php":
                    case "prccscassa.php":
                    case "prccslaaasa.php":
                    case "prccspsa.php":
                    case "prccssaasa.php":
                    case "prccssassa.php":
                    case "prccssspasa.php":
                    case "prclaasa.php":
                    case "prclassa.php":
                    case "prclspasa.php":
                    case "prclssaaasa.php":
                    case "prclssspaasa.php":
                    case "prclssssa.php":
                    case "prcscapsa.php":
                    case "prcslpsa.php":
                    case "prcsssasa.php":
                    case "prcssspaaasa.php":
                    case "seccaaara.php":
                    case "secccara.php":
                    case "seccclpaara.php":
                    case "seccclra.php":
                    case "seccclsapra.php":
                    case "seccclssara.php":
                    case "seccclsspaaara.php":
                    case "seccclssspra.php":
                    case "secccpaaara.php":
                    case "secccslaaara.php":
                    case "secccspra.php":
                    case "secccssaara.php":
                    case "secccssasra.php":
                    case "secccssspara.php":
                    case "secclaara.php":
                    case "secclasra.php":
                    case "secclspara.php":
                    case "secclssaaara.php":
                    case "secclssspaara.php":
                    case "secclsssra.php":
                    case "seccscapra.php":
                    case "seccslpra.php":
                    case "seccspaara.php":
                    case "seccsra.php":
                    case "seccssapra.php":
                    case "seccsssara.php":
                    case "seccssspaaara.php":
                    case "seclapra.php":
                    case "seclsara.php":
                    case "seclspaaara.php":
                    case "seclsspra.php":
                    case "seclsssaara.php":
                    case "seclsssasra.php":
                    case "secscpara.php":
                    case "secslpaara.php":
                    case "secslra.php":
                    case "secsspara.php":
                    case "secsssaaara.php":
                    case "siccapnu.php":
                    case "sicccaanu.php":
                    case "sicccasnu.php":
                    case "siccclanu.php":
                    case "siccclpaaanu.php":
                    case "siccclspnu.php":
                    case "siccclssaanu.php":
                    case "siccclssasnu.php":
                    case "siccclssspanu.php":
                    case "sicccslapnu.php":
                    case "sicccspanu.php":
                    case "sicccssaaanu.php":
                    case "sicccsssnu.php":
                    case "sicccssspaanu.php":
                    case "sicclaaanu.php":
                    case "sicclsnu.php":
                    case "sicclspaanu.php":
                    case "sicclssapnu.php":
                    case "sicclsssanu.php":
                    case "sicclssspaaanu.php":
                    case "siccsanu.php":
                    case "siccscpnu.php":
                    case "siccslpanu.php":
                    case "siccspaaanu.php":
                    case "siccsspnu.php":
                    case "siccsssaanu.php":
                    case "siccsssasnu.php":
                    case "siclpnu.php":
                    case "siclsaanu.php":
                    case "siclsasnu.php":
                    case "siclsspanu.php":
                    case "siclsssaaanu.php":
                    case "sicscnu.php":
                    case "sicscpaanu.php":
                    case "sicslanu.php":
                    case "sicslpaaanu.php":
                    case "sicsspaanu.php":
                    case "sicsssapnu.php":
                    case "uncccappi.php":
                    case "unccclaaapi.php":
                    case "unccclspaapi.php":
                    case "unccclspi.php":
                    case "unccclssappi.php":
                    case "unccclsssapi.php":
                    case "unccclssspaaapi.php":
                    case "uncccsapi.php":
                    case "uncccslpapi.php":
                    case "uncccspaaapi.php":
                    case "uncccssppi.php":
                    case "uncccsssaapi.php":
                    case "uncccsssaspi.php":
                    case "uncclppi.php":
                    case "uncclsaapi.php":
                    case "uncclsaspi.php":
                    case "uncclsspapi.php":
                    case "uncclsssaaapi.php":
                    case "unccpapi.php":
                    case "unccsaaapi.php":
                    case "unccscpaapi.php":
                    case "unccscpi.php":
                    case "unccslapi.php":
                    case "unccslpaaapi.php":
                    case "unccsspaapi.php":
                    case "unccsspi.php":
                    case "unccsssappi.php":
                    case "unclpaapi.php":
                    case "unclpi.php":
                    case "unclsappi.php":
                    case "unclssapi.php":
                    case "unclsspaaapi.php":
                    case "unclsssppi.php":
                    case "uncscaapi.php":
                    case "uncscaspi.php":
                    case "uncslaaapi.php":
                    case "uncssaspi.php":
                    case "uncssspapi.php":
                    case "acceuil.php":
                    case "arcccscase.php":
                    case "arcccscpaaase.php":
                    case "arcdlapse.php":
                    case "arcdlsase.php":
                    case "arcdlspaaase.php":
                    case "arcdlsspse.php":
                    case "arcdlsssaase.php":
                    case "arcdlsssasse.php":
                    case "arcdpse.php":
                    case "arcdsaase.php":
                    case "arcdsasse.php":
                    case "arcdscpase.php":
                    case "arcdslpaase.php":
                    case "arcdslse.php":
                    case "arcdsspase.php":
                    case "arcdsssaaase.php":
                    case "ardaaase.php":
                    case "ardcase.php":
                    case "ardclse.php":
                    case "ardcpaaase.php":
                    case "ardcslaaase.php":
                    case "ardcspse.php":
                    case "ardcssaase.php":
                    case "ardcssasse.php":
                    case "ardcssspase.php":
                    case "ardlaase.php":
                    case "ardlasse.php":
                    case "ardlspase.php":
                    case "ardlssaaase.php":
                    case "ardlssspaase.php":
                    case "ardlsssse.php":
                    case "ardscapse.php":
                    case "ardslpse.php":
                    case "ardspaase.php":
                    case "ardssapse.php":
                    case "ardsse.php":
                    case "ardsssase.php":
                    case "ardssspaaase.php":
                    case "nocccscapbo.php":
                    case "nocdabo.php":
                    case "nocdlbo.php":
                    case "nocdlpaabo.php":
                    case "nocdlsapbo.php":
                    case "nocdlssabo.php":
                    case "nocdlsspaaabo.php":
                    case "nocdlssspbo.php":
                    case "nocdpaaabo.php":
                    case "nocdscaabo.php":
                    case "nocdscasbo.php":
                    case "nocdslaaabo.php":
                    case "nocdspbo.php":
                    case "nocdssaabo.php":
                    case "nocdssasbo.php":
                    case "nocdssspabo.php":
                    case "nodcapbo.php":
                    case "nodclaaabo.php":
                    case "nodcsabo.php":
                    case "nodcslpabo.php":
                    case "nodcspaaabo.php":
                    case "nodcsspbo.php":
                    case "nodcsssaabo.php":
                    case "nodcsssasbo.php":
                    case "nodlpbo.php":
                    case "nodlsaabo.php":
                    case "nodlsasbo.php":
                    case "nodlsspabo.php":
                    case "nodlsssaaabo.php":
                    case "nodpabo.php":
                    case "nodsaaabo.php":
                    case "nodscbo.php":
                    case "nodscpaabo.php":
                    case "nodslabo.php":
                    case "nodslpaaabo.php":
                    case "nodssbo.php":
                    case "nodsspaabo.php":
                    case "nodsssapbo.php":
                    case "pacccscpate.php":
                    case "pacdaaate.php":
                    case "pacdlaate.php":
                    case "pacdlaste.php":
                    case "pacdlspate.php":
                    case "pacdlssaaate.php":
                    case "pacdlssspaate.php":
                    case "pacdlssste.php":
                    case "pacdscapte.php":
                    case "pacdslpte.php":
                    case "pacdspaate.php":
                    case "pacdssapte.php":
                    case "pacdsssate.php":
                    case "pacdssspaaate.php":
                    case "pacdste.php":
                    case "padate.php":
                    case "padclpte.php":
                    case "padcpate.php":
                    case "padcsaaate.php":
                    case "padcslate.php":
                    case "padcslpaaate.php":
                    case "padcsspaate.php":
                    case "padcsssapte.php":
                    case "padcsste.php":
                    case "padlpaate.php":
                    case "padlsapte.php":
                    case "padlssate.php":
                    case "padlsspaaate.php":
                    case "padlssspte.php":
                    case "padlte.php":
                    case "padpaaate.php":
                    case "padscaate.php":
                    case "padscaste.php":
                    case "padslaaate.php":
                    case "padspte.php":
                    case "padssaate.php":
                    case "padssaste.php":
                    case "padssspate.php":
                    case "prcccscpaasa.php":
                    case "prcdapsa.php":
                    case "prcdlaaasa.php":
                    case "prcdlspaasa.php":
                    case "prcdlssa.php":
                    case "prcdlssapsa.php":
                    case "prcdlsssasa.php":
                    case "prcdlssspaaasa.php":
                    case "prcdsasa.php":
                    case "prcdscpsa.php":
                    case "prcdslpasa.php":
                    case "prcdspaaasa.php":
                    case "prcdsspsa.php":
                    case "prcdsssaasa.php":
                    case "prcdsssassa.php":
                    case "prdaasa.php":
                    case "prdassa.php":
                    case "prdcpaasa.php":
                    case "prdcsa.php":
                    case "prdcsapsa.php":
                    case "prdcslaasa.php":
                    case "prdcslassa.php":
                    case "prdcssasa.php":
                    case "prdcsspaaasa.php":
                    case "prdcssspsa.php":
                    case "prdlasa.php":
                    case "prdlpaaasa.php":
                    case "prdlspsa.php":
                    case "prdlssaasa.php":
                    case "prdlssassa.php":
                    case "prdlssspasa.php":
                    case "prdscaaasa.php":
                    case "prdslapsa.php":
                    case "prdspasa.php":
                    case "prdssaaasa.php":
                    case "prdssspaasa.php":
                    case "prdssssa.php":
                    case "secccscaara.php":
                    case "secccscasra.php":
                    case "secdlpra.php":
                    case "secdlsaara.php":
                    case "secdlsasra.php":
                    case "secdlsspara.php":
                    case "secdlsssaaara.php":
                    case "secdpara.php":
                    case "secdsaaara.php":
                    case "secdscpaara.php":
                    case "secdscra.php":
                    case "secdslara.php":
                    case "secdslpaaara.php":
                    case "secdsspaara.php":
                    case "secdssra.php":
                    case "secdsssapra.php":
                    case "sedapra.php":
                    case "sedcaara.php":
                    case "sedcasra.php":
                    case "sedclara.php":
                    case "sedcslapra.php":
                    case "sedcspara.php":
                    case "sedcssaaara.php":
                    case "sedcssspaara.php":
                    case "sedcsssra.php":
                    case "sedlaaara.php":
                    case "sedlspaara.php":
                    case "sedlsra.php":
                    case "sedlssapra.php":
                    case "sedlsssara.php":
                    case "sedlssspaaara.php":
                    case "sedsara.php":
                    case "sedscpra.php":
                    case "sedslpara.php":
                    case "sedspaaara.php":
                    case "sedsspra.php":
                    case "sedsssaara.php":
                    case "sedsssasra.php":
                    case "sicccscaaanu.php":
                    case "sicdlpanu.php":
                    case "sicdlsaaanu.php":
                    case "sicdlssnu.php":
                    case "sicdlsspaanu.php":
                    case "sicdlsssapnu.php":
                    case "sicdnu.php":
                    case "sicdpaanu.php":
                    case "sicdsapnu.php":
                    case "sicdscanu.php":
                    case "sicdscpaaanu.php":
                    case "sicdslaanu.php":
                    case "sicdslasnu.php":
                    case "sicdssanu.php":
                    case "sicdsspaaanu.php":
                    case "sicdssspnu.php":
                    case "sidcaaanu.php":
                    case "sidclaanu.php":
                    case "sidcslpnu.php":
                    case "sidcsnu.php":
                    case "sidcspaanu.php":
                    case "sidcssapnu.php":
                    case "sidcsssanu.php":
                    case "sidcssspaaanu.php":
                    case "sidlapnu.php":
                    case "sidlsanu.php":
                    case "sidlspaaanu.php":
                    case "sidlsspnu.php":
                    case "sidlsssaanu.php":
                    case "sidlsssasnu.php":
                    case "sidpnu.php":
                    case "sidsaanu.php":
                    case "sidsasnu.php":
                    case "sidscpanu.php":
                    case "sidslnu.php":
                    case "sidslpaanu.php":
                    case "sidsspanu.php":
                    case "sidsssaaanu.php":
                    case "signature.php":
                    case "testcache_dump.php":
                    case "uncccscppi.php":
                    case "uncdaapi.php":
                    case "uncdaspi.php":
                    case "uncdlapi.php":
                    case "uncdlpaaapi.php":
                    case "uncdlsppi.php":
                    case "uncdlssaapi.php":
                    case "uncdlssaspi.php":
                    case "uncdlssspapi.php":
                    case "uncdscaaapi.php":
                    case "uncdslappi.php":
                    case "uncdspapi.php":
                    case "uncdssaaapi.php":
                    case "uncdssspaapi.php":
                    case "uncdssspi.php":
                    case "undclappi.php":
                    case "undcppi.php":
                    case "undcsaapi.php":
                    case "undcsaspi.php":
                    case "undcslpaapi.php":
                    case "undcslpi.php":
                    case "undcsspapi.php":
                    case "undcsssaaapi.php":
                    case "undlpapi.php":
                    case "undlsaaapi.php":
                    case "undlsspaapi.php":
                    case "undlsspi.php":
                    case "undlsssappi.php":
                    case "undpaapi.php":
                    case "undpi.php":
                    case "undsappi.php":
                    case "undscapi.php":
                    case "undscpaaapi.php":
                    case "undslaapi.php":
                    case "undslaspi.php":
                    case "undssapi.php":
                    case "undsspaaapi.php":
                    case "undsssppi.php":
                    case "arcmaase.php":
                    case "arcmasse.php":
                    case "arcmlase.php":
                    case "arcmlpaaase.php":
                    case "arcmlspse.php":
                    case "arcmlssaase.php":
                    case "arcmlssasse.php":
                    case "arcmlssspase.php":
                    case "arcmscaaase.php":
                    case "arcmslapse.php":
                    case "arcmspase.php":
                    case "arcmssaaase.php":
                    case "arcmssspaase.php":
                    case "arcmsssse.php":
                    case "ardcccapse.php":
                    case "ardccclaaase.php":
                    case "ardccclspaase.php":
                    case "ardccclssapse.php":
                    case "ardccclsse.php":
                    case "ardccclsssase.php":
                    case "ardccclssspaaase.php":
                    case "ardcccsase.php":
                    case "ardcccscpse.php":
                    case "ardcccslpase.php":
                    case "ardcccspaaase.php":
                    case "ardcccsspse.php":
                    case "ardcccsssaase.php":
                    case "ardcccsssasse.php":
                    case "ardcclpse.php":
                    case "ardcclsaase.php":
                    case "ardcclsasse.php":
                    case "ardcclsspase.php":
                    case "ardcclsssaaase.php":
                    case "ardccpase.php":
                    case "ardccsaaase.php":
                    case "ardccscpaase.php":
                    case "ardccscse.php":
                    case "ardccslase.php":
                    case "ardccslpaaase.php":
                    case "ardccsspaase.php":
                    case "ardccsssapse.php":
                    case "ardccssse.php":
                    case "ardclpaase.php":
                    case "ardclsapse.php":
                    case "ardclssase.php":
                    case "ardclsspaaase.php":
                    case "ardclssspse.php":
                    case "ardcscaase.php":
                    case "ardcscasse.php":
                    case "armclapse.php":
                    case "armclsase.php":
                    case "armcpse.php":
                    case "armcsaase.php":
                    case "armcsasse.php":
                    case "armcslpaase.php":
                    case "armcslse.php":
                    case "armcsspase.php":
                    case "armcsssaaase.php":
                    case "armlpase.php":
                    case "armlsaaase.php":
                    case "armlsspaase.php":
                    case "armlsssapse.php":
                    case "armlssse.php":
                    case "armpaase.php":
                    case "armsapse.php":
                    case "armscase.php":
                    case "armscpaaase.php":
                    case "armse.php":
                    case "armslaase.php":
                    case "armslasse.php":
                    case "armssase.php":
                    case "armsspaaase.php":
                    case "armssspse.php":
                    case "nocmlapbo.php":
                    case "nocmlsabo.php":
                    case "nocmlspaaabo.php":
                    case "nocmlsspbo.php":
                    case "nocmlsssaabo.php":
                    case "nocmlsssasbo.php":
                    case "nocmpbo.php":
                    case "nocmsaabo.php":
                    case "nocmsasbo.php":
                    case "nocmscpabo.php":
                    case "nocmslbo.php":
                    case "nocmslpaabo.php":
                    case "nocmsspabo.php":
                    case "nocmsssaaabo.php":
                    case "nodccaabo.php":
                    case "nodccasbo.php":
                    case "nodcccbo.php":
                    case "nodccclpabo.php":
                    case "nodccclsaaabo.php":
                    case "nodccclssbo.php":
                    case "nodccclsspaabo.php":
                    case "nodccclsssapbo.php":
                    case "nodcccpaabo.php":
                    case "nodcccsapbo.php":
                    case "nodcccscabo.php":
                    case "nodcccscpaaabo.php":
                    case "nodcccslaabo.php":
                    case "nodcccslasbo.php":
                    case "nodcccssabo.php":
                    case "nodcccsspaaabo.php":
                    case "nodcccssspbo.php":
                    case "nodcclabo.php":
                    case "nodcclpaaabo.php":
                    case "nodcclspbo.php":
                    case "nodcclssaabo.php":
                    case "nodcclssasbo.php":
                    case "nodcclssspabo.php":
                    case "nodccscaaabo.php":
                    case "nodccslapbo.php":
                    case "nodccspabo.php":
                    case "nodccssaaabo.php":
                    case "nodccsssbo.php":
                    case "nodccssspaabo.php":
                    case "nodclsbo.php":
                    case "nodclspaabo.php":
                    case "nodclssapbo.php":
                    case "nodclsssabo.php":
                    case "nodclssspaaabo.php":
                    case "nodcscpbo.php":
                    case "nomaaabo.php":
                    case "nomcabo.php":
                    case "nomclbo.php":
                    case "nomclpaabo.php":
                    case "nomcpaaabo.php":
                    case "nomcslaaabo.php":
                    case "nomcspbo.php":
                    case "nomcssaabo.php":
                    case "nomcssasbo.php":
                    case "nomcssspabo.php":
                    case "nomlaabo.php":
                    case "nomlasbo.php":
                    case "nomlspabo.php":
                    case "nomlssaaabo.php":
                    case "nomlsssbo.php":
                    case "nomlssspaabo.php":
                    case "nomsbo.php":
                    case "nomscapbo.php":
                    case "nomslpbo.php":
                    case "nomspaabo.php":
                    case "nomssapbo.php":
                    case "nomsssabo.php":
                    case "nomssspaaabo.php":
                    case "pacmlpate.php":
                    case "pacmlsaaate.php":
                    case "pacmlsspaate.php":
                    case "pacmlsssapte.php":
                    case "pacmlsste.php":
                    case "pacmpaate.php":
                    case "pacmsapte.php":
                    case "pacmscate.php":
                    case "pacmscpaaate.php":
                    case "pacmslaate.php":
                    case "pacmslaste.php":
                    case "pacmssate.php":
                    case "pacmsspaaate.php":
                    case "pacmssspte.php":
                    case "pacmte.php":
                    case "padccapte.php":
                    case "padcccaate.php":
                    case "padcccaste.php":
                    case "padccclate.php":
                    case "padccclpaaate.php":
                    case "padccclspte.php":
                    case "padccclssaate.php":
                    case "padccclssaste.php":
                    case "padccclssspate.php":
                    case "padcccscaaate.php":
                    case "padcccslapte.php":
                    case "padcccspate.php":
                    case "padcccssaaate.php":
                    case "padcccssspaate.php":
                    case "padcccssste.php":
                    case "padcclaaate.php":
                    case "padcclspaate.php":
                    case "padcclssapte.php":
                    case "padcclsssate.php":
                    case "padcclssspaaate.php":
                    case "padcclste.php":
                    case "padccsate.php":
                    case "padccscpte.php":
                    case "padccslpate.php":
                    case "padccspaaate.php":
                    case "padccsspte.php":
                    case "padccsssaate.php":
                    case "padccsssaste.php":
                    case "padclsaate.php":
                    case "padclsaste.php":
                    case "padclsspate.php":
                    case "padclsssaaate.php":
                    case "padcscpaate.php":
                    case "padcscte.php":
                    case "pamcaaate.php":
                    case "pamclaate.php":
                    case "pamclaste.php":
                    case "pamcslpte.php":
                    case "pamcspaate.php":
                    case "pamcssapte.php":
                    case "pamcsssate.php":
                    case "pamcssspaaate.php":
                    case "pamcste.php":
                    case "pamlapte.php":
                    case "pamlsate.php":
                    case "pamlspaaate.php":
                    case "pamlsspte.php":
                    case "pamlsssaate.php":
                    case "pamlsssaste.php":
                    case "pampte.php":
                    case "pamsaate.php":
                    case "pamsaste.php":
                    case "pamscpate.php":
                    case "pamslpaate.php":
                    case "pamslte.php":
                    case "pamsspate.php":
                    case "pamsssaaate.php":
                    case "prcmasa.php":
                    case "prcmlpaasa.php":
                    case "prcmlsa.php":
                    case "prcmlsapsa.php":
                    case "prcmlssasa.php":
                    case "prcmlsspaaasa.php":
                    case "prcmlssspsa.php":
                    case "prcmpaaasa.php":
                    case "prcmscaasa.php":
                    case "prcmscassa.php":
                    case "prcmslaaasa.php":
                    case "prcmspsa.php":
                    case "prcmssaasa.php":
                    case "prcmssassa.php":
                    case "prcmssspasa.php":
                    case "prdcccaaasa.php":
                    case "prdccclaasa.php":
                    case "prdccclassa.php":
                    case "prdccclspasa.php":
                    case "prdccclssaaasa.php":
                    case "prdccclssspaasa.php":
                    case "prdccclssssa.php":
                    case "prdcccscapsa.php":
                    case "prdcccslpsa.php":
                    case "prdcccspaasa.php":
                    case "prdcccssa.php":
                    case "prdcccssapsa.php":
                    case "prdcccsssasa.php":
                    case "prdcccssspaaasa.php":
                    case "prdcclapsa.php":
                    case "prdcclsasa.php":
                    case "prdcclspaaasa.php":
                    case "prdcclsspsa.php":
                    case "prdcclsssaasa.php":
                    case "prdcclsssassa.php":
                    case "prdccpsa.php":
                    case "prdccsaasa.php":
                    case "prdccsassa.php":
                    case "prdccscpasa.php":
                    case "prdccslpaasa.php":
                    case "prdccslsa.php":
                    case "prdccsspasa.php":
                    case "prdccsssaaasa.php":
                    case "prdclpasa.php":
                    case "prdclsaaasa.php":
                    case "prdclsspaasa.php":
                    case "prdclsssa.php":
                    case "prdclsssapsa.php":
                    case "prdcscasa.php":
                    case "prdcscpaaasa.php":
                    case "prmcapsa.php":
                    case "prmclaaasa.php":
                    case "prmclssa.php":
                    case "prmcsasa.php":
                    case "prmcslpasa.php":
                    case "prmcspaaasa.php":
                    case "prmcsspsa.php":
                    case "prmcsssaasa.php":
                    case "prmcsssassa.php":
                    case "prmlpsa.php":
                    case "prmlsaasa.php":
                    case "prmlsassa.php":
                    case "prmlsspasa.php":
                    case "prmlsssaaasa.php":
                    case "prmpasa.php":
                    case "prmsaaasa.php":
                    case "prmscpaasa.php":
                    case "prmscsa.php":
                    case "prmslasa.php":
                    case "prmslpaaasa.php":
                    case "prmsspaasa.php":
                    case "prmsssa.php":
                    case "prmsssapsa.php":
                    // ELIMINAR-BORRAR ENE 2028
                    case "recuperadatossihabiaabandonado.php":
                    // ELIMINAR-BORRAR ENE 2028
                    case "secmaaara.php":
                    case "secmlaara.php":
                    case "secmlasra.php":
                    case "secmlspara.php":
                    case "secmlssaaara.php":
                    case "secmlssspaara.php":
                    case "secmlsssra.php":
                    case "secmscapra.php":
                    case "secmslpra.php":
                    case "secmspaara.php":
                    case "secmsra.php":
                    case "secmssapra.php":
                    case "secmsssara.php":
                    case "secmssspaaara.php":
                    case "sedccclapra.php":
                    case "sedccclsara.php":
                    case "sedccclspaaara.php":
                    case "sedccclsspra.php":
                    case "sedccclsssaara.php":
                    case "sedccclsssasra.php":
                    case "sedcccpra.php":
                    case "sedcccsaara.php":
                    case "sedcccsasra.php":
                    case "sedcccscpara.php":
                    case "sedcccslpaara.php":
                    case "sedcccslra.php":
                    case "sedcccsspara.php":
                    case "sedcccsssaaara.php":
                    case "sedcclpara.php":
                    case "sedcclsaaara.php":
                    case "sedcclsspaara.php":
                    case "sedcclssra.php":
                    case "sedcclsssapra.php":
                    case "sedccpaara.php":
                    case "sedccra.php":
                    case "sedccsapra.php":
                    case "sedccscara.php":
                    case "sedccscpaaara.php":
                    case "sedccslaara.php":
                    case "sedccslasra.php":
                    case "sedccssara.php":
                    case "sedccsspaaara.php":
                    case "sedccssspra.php":
                    case "sedclpaaara.php":
                    case "sedclspra.php":
                    case "sedclssaara.php":
                    case "sedclssasra.php":
                    case "sedclssspara.php":
                    case "sedcscaaara.php":
                    case "semara.php":
                    case "semclpra.php":
                    case "semclsaara.php":
                    case "semcpara.php":
                    case "semcsaaara.php":
                    case "semcslara.php":
                    case "semcslpaaara.php":
                    case "semcsspaara.php":
                    case "semcssra.php":
                    case "semcsssapra.php":
                    case "semlpaara.php":
                    case "semlra.php":
                    case "semlsapra.php":
                    case "semlssara.php":
                    case "semlsspaaara.php":
                    case "semlssspra.php":
                    case "sempaaara.php":
                    case "semscaara.php":
                    case "semscasra.php":
                    case "semslaaara.php":
                    case "semspra.php":
                    case "semssaara.php":
                    case "semssasra.php":
                    case "semssspara.php":
                    case "sicmapnu.php":
                    case "sicmlaaanu.php":
                    case "sicmlsnu.php":
                    case "sicmlspaanu.php":
                    case "sicmlssapnu.php":
                    case "sicmlsssanu.php":
                    case "sicmlssspaaanu.php":
                    case "sicmsanu.php":
                    case "sicmscpnu.php":
                    case "sicmslpanu.php":
                    case "sicmspaaanu.php":
                    case "sicmsspnu.php":
                    case "sicmsssaanu.php":
                    case "sicmsssasnu.php":
                    case "sidccanu.php":
                    case "sidccclpnu.php":
                    case "sidccclsaanu.php":
                    case "sidccclsasnu.php":
                    case "sidccclsspanu.php":
                    case "sidccclsssaaanu.php":
                    case "sidcccpanu.php":
                    case "sidcccsaaanu.php":
                    case "sidcccscnu.php":
                    case "sidcccscpaanu.php":
                    case "sidcccslanu.php":
                    case "sidcccslpaaanu.php":
                    case "sidcccssnu.php":
                    case "sidcccsspaanu.php":
                    case "sidcccsssapnu.php":
                    case "sidcclnu.php":
                    case "sidcclpaanu.php":
                    case "sidcclsapnu.php":
                    case "sidcclssanu.php":
                    case "sidcclsspaaanu.php":
                    case "sidcclssspnu.php":
                    case "sidccpaaanu.php":
                    case "sidccscaanu.php":
                    case "sidccscasnu.php":
                    case "sidccslaaanu.php":
                    case "sidccspnu.php":
                    case "sidccssaanu.php":
                    case "sidccssasnu.php":
                    case "sidccssspanu.php":
                    case "sidclasnu.php":
                    case "sidclspanu.php":
                    case "sidclssaaanu.php":
                    case "sidclsssnu.php":
                    case "sidclssspaanu.php":
                    case "sidcscapnu.php":
                    case "simaanu.php":
                    case "simasnu.php":
                    case "simclpanu.php":
                    case "simclsaaanu.php":
                    case "simcnu.php":
                    case "simcpaanu.php":
                    case "simcsapnu.php":
                    case "simcslaanu.php":
                    case "simcslasnu.php":
                    case "simcssanu.php":
                    case "simcsspaaanu.php":
                    case "simcssspnu.php":
                    case "simlanu.php":
                    case "simlpaaanu.php":
                    case "simlspnu.php":
                    case "simlssaanu.php":
                    case "simlssasnu.php":
                    case "simlssspanu.php":
                    case "simscaaanu.php":
                    case "simslapnu.php":
                    case "simspanu.php":
                    case "simssaaanu.php":
                    case "simsssnu.php":
                    case "simssspaanu.php":
                    case "uncmlppi.php":
                    case "uncmlsaapi.php":
                    case "uncmlsaspi.php":
                    case "uncmlsspapi.php":
                    case "uncmlsssaaapi.php":
                    case "uncmpapi.php":
                    case "uncmsaaapi.php":
                    case "uncmscpaapi.php":
                    case "uncmscpi.php":
                    case "uncmslapi.php":
                    case "uncmslpaaapi.php":
                    case "uncmsspaapi.php":
                    case "uncmsspi.php":
                    case "uncmsssappi.php":
                    case "undccaaapi.php":
                    case "undcccapi.php":
                    case "undccclpaapi.php":
                    case "undccclpi.php":
                    case "undccclsappi.php":
                    case "undccclssapi.php":
                    case "undccclsspaaapi.php":
                    case "undccclsssppi.php":
                    case "undcccpaaapi.php":
                    case "undcccscaapi.php":
                    case "undcccscaspi.php":
                    case "undcccslaaapi.php":
                    case "undcccsppi.php":
                    case "undcccssaapi.php":
                    case "undcccssaspi.php":
                    case "undcccssspapi.php":
                    case "undcclaapi.php":
                    case "undcclaspi.php":
                    case "undcclspapi.php":
                    case "undcclssaaapi.php":
                    case "undcclssspaapi.php":
                    case "undcclssspi.php":
                    case "undccscappi.php":
                    case "undccslppi.php":
                    case "undccspaapi.php":
                    case "undccspi.php":
                    case "undccssappi.php":
                    case "undccsssapi.php":
                    case "undccssspaaapi.php":
                    case "undclsapi.php":
                    case "undclspaaapi.php":
                    case "undclssppi.php":
                    case "undclsssaapi.php":
                    case "undclsssaspi.php":
                    case "undcscpapi.php":
                    case "unmappi.php":
                    case "unmcaapi.php":
                    case "unmcaspi.php":
                    case "unmclapi.php":
                    case "unmclpaaapi.php":
                    case "unmcslappi.php":
                    case "unmcspapi.php":
                    case "unmcssaaapi.php":
                    case "unmcssspaapi.php":
                    case "unmcssspi.php":
                    case "unmlaaapi.php":
                    case "unmlspaapi.php":
                    case "unmlspi.php":
                    case "unmlssappi.php":
                    case "unmlsssapi.php":
                    case "unmlssspaaapi.php":
                    case "unmsapi.php":
                    case "unmscppi.php":
                    case "unmslpapi.php":
                    case "unmspaaapi.php":
                    case "unmssppi.php":
                    case "unmsssaapi.php":
                    case "unmsssaspi.php":
                    case "uploadedfiles_kill.php":
                    case "uploadedfiles_del.php":
                    case "uploadedfiles_zipbydatetype.php":
                    case "quienesrespondieronweb.php":
                    case "dataweb_dame_linea_paraesteid.php":
                    case "dataweb_dame_todadata.php":
                    case "editarcasos.php":
                    case "dame_chorizo_data_online.php":
                    case "recibe_data_online.php":
                    case "ajax_dame_dataxls.php":
                    case "ajax_dame_dataxls.php":
                    case "ajax_dame_dataxls.php":
                    case "borraarchivodegrabacion.php":
                    case "damearchivosgrabaciones.php":
                    case "unzip-old-php7.php":
                    case "test_zip.php":
                    case "damearchivossubidos2.php":
                    case "damelistadodeservidores.php":
                    case "damelistadodeservidoresver2.php":
                    case "reemplazarimagen.php":
                    case "cawi_guardarpass.php":
                    case "cawi_remuevepassword.php":
                    case "vb6_dame_file_system.php":
                    case "ajax_password_ar.php":
                    case "ajax_alterargeolocadesdemapa.php":
                    case "revisarssl.php":




                    case "3cwebhook_call_was_connected.php":
                    case "3cwebhook_history_was_created.php":
                    case "3cwebhook_start_call_end.php":
                    case "3cwebhook_start_call_start.php":
                    case "3c_hay_llamadas_paraesteagente.php":



                        break;
                    default:
                        if (strpos($item, "ecibeFileAdjunto") == false) {
                            if (strpos($item, "ameHijosDeEsteTextoAcum_EnJer") > 0) {
                            } elseif (strpos($item, "jax_Jerarquia_DameHijosDeEsteTextoAcum") > 0) {

                            } elseif (strpos($item, "jax_Jerarquia_DameHijosDeEsteTextoAcum") > 0) {

                            } elseif (strpos($item, "jax_Jerarquia_ValidaLineaDeTextos") > 0) {

                            } elseif (strpos($item, "ameDisparos_rotacion_secuencial_") > 0) {

                            } elseif (strpos($item, "axDif_Dame") > 0) {

                            } elseif (strpos($item, "urfAnalysis_") > 0) {

                            } elseif (strpos($item, "urf_chart_") > 0) {


                            } else {
                                echo "<li style='color:red;'><b>$item</b></li>";
                                $Sospechosos++;
                            }
                        }
                }
            }

            if (isset($versionHtaccess)) {
                echo "<script>versionHtaccess='" . $versionHtaccess . "';</script>";
            }

            // archivos de mas de 300 MB QUE ES ESO?
            if (filesize($start . '/' . $item) > 300000000) {
                echo "<li style='color:red;'><b>$item" . " (LARGE FILE: " . round(filesize($start . '/' . $item) / (1024 * 1024), 1) . " MB.)</b></li>";
                $Sospechosos++;
            }
        }

    } // cierro for each
    if ($contFiles > 20000) {
        echo "<li style='color:red;'><b> (TOO MANY FILES: " . $contFiles . ")" . "</b></li>";
        $Sospechosos++;
    }
    echo "</ul> ";
}
// TEST VALIDA FTP
//----------------------------------------------------------------------------------------------------------------------------------------
function pingFTP($ftp_server)
{
    $conn_id = ftp_connect($ftp_server);
    if ($conn_id) {
        $login_result = ftp_login($conn_id, 'usrftpversta@' . $_SERVER['HTTP_HOST'], 'Rotator123!');
        if ($login_result) {
            return 1; // FTP server is reachable and login was successful
        } else {
            return 2; // FTP server is reachable but login failed
        }
        ftp_close($conn_id);
    } else {
        return 0;
    }
}
//----------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------
function folderSize($dir)
{
    $size = 0;
    foreach (glob(rtrim($dir, "/") . "/*", GLOB_NOSORT) as $each) {
        $size += is_file($each) ? filesize($each) : folderSize($each);
    }
    return $size;
}
//TEST VALIDA BASE DE DATOS
//----------------------------------------------------------------------------------------------------------------------------------------
$MySQLActivo = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
$colorBD = 'yellow';
try {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    $host = $GLOBALS['master_host'];
    $db = $GLOBALS['master_db'];
    $user = $GLOBALS['master_user'];
    $pass = $GLOBALS['master_pass'];
    $conectarPDO = 'mysql:host=' . $host . ';dbname=' . $db . ';charset=utf8';
    $db = new PDO($conectarPDO, $user, $pass);
    $MySQLActivo = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
    $colorBD = 'white';
} catch (Exception $e) {
}



//TEST VALIDA TABLAS
$MySQExistenTablas = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
$colorTablas = 'red';




try {
    $host = $GLOBALS['master_host'];
    $dbName = $GLOBALS['master_db'];
    $user = $GLOBALS['master_user'];
    $pass = $GLOBALS['master_pass'];

    $pdo = new PDO("mysql:host=$host;dbname=$dbName;charset=utf8", $user, $pass);

    // Check if PRODUCTS table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'Tbl_estudios_offline'");
    if ($stmt && $stmt->rowCount() > 0) {
        // Table exists
        $MySQExistenTablas = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
        $colorTablas = 'lightgreen';
    } else {



    }

} catch (Exception $e) {

}






//----------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------
//TEST DE ZIP
//----------------------------------------------------------------------------------------------------------------------------------------
if (unzipfile('TestZipNoMatar.zip')) {
    $zipExtension = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
} else {
    $zipExtension = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
}
//----------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------------------------
// VALIDACION DE CREDENCIALES
//----------------------------------------------------------------------------------------------------------------------------------------
if (!isset($_SESSION['EntroAdmin']))
    $_SESSION['EntroAdmin'] = false;
if (!isset($_SESSION['EntroAnalyst']))
    $_SESSION['EntroAnalyst'] = false;
if (!isset($_SESSION['EntroAssistant']))
    $_SESSION['EntroAssistant'] = false;
if (!isset($_SESSION['UsuarioActivo']))
    $_SESSION['UsuarioActivo'] = '';
$_POST['EnviaLoginPass'] = !isset($_POST['EnviaLoginPass']) ? '' : $_POST['EnviaLoginPass'];







$entraDirecto = false;

if ($Ip == $IP_Auto_CHACAO OR $Ip == $IP_Auto_PARAISO OR $Ip == $IP_Auto_USA OR $Ip == $IP_Auto_CHACAO_ABA) {
    $_SESSION['EntroAdmin'] = true;
    $_SESSION['UsuarioActivo'] = 'Auto by ip';
    $login_success = true;
    $entraDirecto = true;
}




if ($_POST['EnviaLoginPass'] or $entraDirecto) {
    $clave = $_POST['input_clave'];
    $usuario = $_POST['input_usuario'];
    $login_success = false;

    // REVISA TODOS LOS ADMINS DECLARADOS EN ARCHIVO .ADMINS (maestro_admin_login/pass)
    if (isset($GLOBALS['master_admin_login']) && is_array($GLOBALS['master_admin_login'])) {
        for ($u = 0; $u < count($GLOBALS['master_admin_login']); $u++) {
            if ($usuario == $GLOBALS['master_admin_login'][$u] && $clave == $GLOBALS['master_admin_pass'][$u]) {
                $_SESSION['EntroAdmin'] = true;
                $_SESSION['UsuarioActivo'] = $usuario;
                $login_success = true;
                break;
            }
        }
    }
    if (!$login_success) { // Solo si no se ha logueado como admin    
        if (isset($GLOBALS['master_analyst_login']) && is_array($GLOBALS['master_analyst_login'])) {
            for ($u = 0; $u < count($GLOBALS['master_analyst_login']); $u++) {
                if ($usuario == $GLOBALS['master_analyst_login'][$u] && $clave == $GLOBALS['master_analyst_pass'][$u]) {
                    $_SESSION['EntroAnalyst'] = true;
                    $_SESSION['UsuarioActivo'] = $usuario;
                    $login_success = true;
                    break;
                }
            }
        }
    }
    if (!$login_success) { // Solo si no se ha logueado como admin o analyst
        if (isset($GLOBALS['master_assistant_login']) && is_array($GLOBALS['master_assistant_login'])) {
            for ($u = 0; $u < count($GLOBALS['master_assistant_login']); $u++) {
                if ($usuario == $GLOBALS['master_assistant_login'][$u] && $clave == $GLOBALS['master_assistant_pass'][$u]) {
                    $_SESSION['EntroAssistant'] = true;
                    $_SESSION['UsuarioActivo'] = $usuario;
                    $login_success = true;
                    break;
                }
            }
        }
    }
    if ($login_success) {
        header("Location: " . $_SERVER['PHP_SELF']); // Redirige en caso de éxito
    } else {
        $mensaje_error_login = "Incorrect Login or password.";
    }
}


// Lógica para cerrar sesión (si se recibe un parámetro 'Close')
if (isset($_GET['Close'])) {
    $_SESSION = array(); // Borra todas las variables de sesión
    session_destroy(); // Destruye la sesión
    header("Location: " . $_SERVER['PHP_SELF']); // Redirige a la página de login
}




if (!($_SESSION['EntroAdmin'] || $_SESSION['EntroAnalyst'] || $_SESSION['EntroAssistant'])) {
    echo '
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
            <meta http-equiv="Pragma" content="no-cache">
            <meta http-equiv="Expires" content="0">
            <title>Estructura</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    display: flex;
                    min-height: 100vh;
                    margin: 0;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: center;
                }
                .login-container {background-color: #fff;padding: 30px;border-radius: 8px;box-shadow: 8px 10px 5px rgba(0,0,0,0.05);width: 350px;text-align: center;}
                .login-container h2 {margin-bottom: 20px;color: #333;}
                .login-container input[type="text"], .login-container input[type="password"] {width: calc(100% - 20px);padding: 10px;margin-bottom: 15px;border: 1px solid #ddd;border-radius: 4px;}
                .login-container input[type="submit"] {background-color: #007bff;color: white;padding: 10px 15px;border: none;border-radius: 4px;cursor: pointer;font-size: 16px;width: 100%;}
                .login-container input[type="submit"]:hover {background-color: #0056b3;}
                .error-message {color: red;margin-bottom: 15px;}
                
                
            </style>
        </head>
        <body>
        




            <div class="login-container">
                <h2>Credentials</h2>
            ';
    if (!empty($mensaje_error_login))
        ;
    echo ' 
                <p class="error-message">' . $mensaje_error_login . '</p>
                <form action="" method="post">
                    <input type="text" name="input_usuario" placeholder="User" required>
                    <input type="password" name="input_clave" placeholder="Password" required>
                    <input type="hidden" name="EnviaLoginPass" value="1">
                    <input type="submit" value="Enter">
                    
                </form>
            </div>
            
                        
            <p style="font-size:10px;color:#999999">VIP:' . $IP_Auto_CHACAO . '  -  ' . $IP_Auto_PARAISO . '  -  ' . $IP_Auto_USA . ' (Vs. current: ' . $Ip . ')</p>
            
            
            
            
            
        </body>
    </html>';
} else {
    // TEST DE CURL
    // ---------------------------------------------------------------------------------------------------------------------------------------
    $url = 'https://www.google.com';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    if ($response !== false) { {
            $colorCurl = 'white';
            $CurlActivo = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
        }
    }
    curl_close($ch);
    // ---------------------------------------------------------------------------------------------------------------------------------------
    // TEST DE SERVICIO DE GEOLOCALIZACION MEDIANTE IP USANDO CURL
    // ---------------------------------------------------------------------------------------------------------------------------------------
    if ($lugar == '') {
        $ip = '51.15.0.0'; // IP RANDOM EN FRANCIA
        $api = 'https://get.geojs.io/v1/ip/geo/' . $ip . '.json';
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $api);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        $json = curl_exec($ch);
        $obj = json_decode($json, true);
        if (is_array($obj)) {
            $colorGeo = 'white';
            $GeoActivo = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
        }
        curl_close($ch);
    }
    // ---------------------------------------------------------------------------------------------------------------------------------------
    // TEST PHP SYSTEM COMMANDS
    $LinuxCommands = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
    $colorLinuxCommands = 'yellow';
    try {
        $testLinuxFile = 'TestLinux.txt';
        if (file_exists($testLinuxFile)) {
            unlink($testLinuxFile);
        }
        $cmd = 'echo 1 > ' . $testLinuxFile;
        system($cmd);
        if (file_exists($testLinuxFile)) {
            $LinuxCommands = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
            $colorLinuxCommands = 'white';
        }
    } catch (Exception $e) {
    }

    if (session_status() == PHP_SESSION_ACTIVE) {
        $sessionTest = 'https://cdn-icons-png.flaticon.com/512/390/390973.png';
        $sessionTestColor = 'white';
    } else {
        $sessionTest = 'https://cdn-icons-png.flaticon.com/512/594/594864.png';
        $sessionTestColor = 'yellow';
    }


    $fileDump = 'testCache_DUMP.php';
    file_put_contents($fileDump, '1');
    $LeoFile1 = file_get_contents($fileDump);
    file_put_contents($fileDump, '2');
    $LeoFile2 = file_get_contents($fileDump);
    if ($LeoFile1 == $LeoFile2)
        $CacheDeFilesPHP = 1;
    $LeoFComunesJS = file_get_contents("../web/varias/funciones_comunes.js");
    $LeoFComunesPHP = file_get_contents("../web/varias/funciones_comunes.php");
    $posVersion = strpos($LeoFComunesJS, 'VERSION:');
    $VersionFComunesJS = substr($LeoFComunesJS, $posVersion + 8, 6);
    $posVersion = strpos($LeoFComunesPHP, 'VERSION:');
    $VersionFComunesPHP = substr($LeoFComunesPHP, $posVersion + 8, 6);
    $VersionPHP = phpversion();
    $VersionPHP = explode('.', $VersionPHP); // Obtiene la versión de PHP actual
    if (version_compare(phpversion(), '8.1', '<')) {


        $VersionPHP = phpversion() . ' ' . '<img style=' . $imagenmala . '>';
        $VersionPHPColor = 'red';



    } else {
        $VersionPHP = phpversion() . '<img style=' . $imagenbuena . '>';
        $VersionPHPColor = '#9fa7afff';
    }


    // Definición de íconos según el requerimiento del usuario.
    $ICONO_EXITO = '<img style="height: 25px; width: 25px;" src="https://cdn-icons-png.flaticon.com/512/390/390973.png">';
    $ICONO_FALLO = '<img style="height: 25px; width: 25px;" src="https://cdn-icons-png.flaticon.com/512/594/594864.png">';

    // Inicialización de la variable de resultado.
    $URL_CORTA = "";
    $pathToFile = "../.htaccess";

    // Banderas de estado para los 4 componentes críticos
    $engine_on_found = false;
    $cond_f_found = false; // RewriteCond %{REQUEST_FILENAME} !-f
    $cond_d_found = false; // RewriteCond %{REQUEST_FILENAME} !-d
    $rule_target_found = false;

    $error_acceso_lectura = false;

    // 1. Bloque de verificación y manejo de errores de acceso.
    if (!file_exists($pathToFile) || !is_readable($pathToFile)) {
        $URL_CORTA = $ICONO_FALLO . " Error: No se pudo acceder o leer el archivo '{$pathToFile}'.";
        $error_acceso_lectura = true;
    }

    // 2. Proceso de lectura y análisis.
    if (!$error_acceso_lectura) {
        // Leer el archivo en un array, línea por línea.
        $lineas = @file($pathToFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        if ($lineas === false) {
            $URL_CORTA = $ICONO_FALLO . " Error: Falló la lectura del archivo '{$pathToFile}'.";
        } else {
            // Expresiones regulares para la búsqueda línea por línea
            $cond_f_pattern = '/^RewriteCond\s+\%\{REQUEST_FILENAME\}\s+!\-f/i';
            $cond_d_pattern = '/^RewriteCond\s+\%\{REQUEST_FILENAME\}\s+!\-d/i';
            $rule_target_pattern = '/^RewriteRule\s+.*redireccionarShortLink\.php\?cod\=\$1\s+\[L\]/i';

            foreach ($lineas as $linea) {
                $linea_limpia = trim($linea);

                // 1. Verificar RewriteEngine On
                if (strcasecmp($linea_limpia, 'RewriteEngine On') === 0) {
                    $engine_on_found = true;
                    continue;
                }

                // 2. Verificar las dos RewriteCond críticas
                if (preg_match($cond_f_pattern, $linea_limpia)) {
                    $cond_f_found = true;
                    continue;
                }
                if (preg_match($cond_d_pattern, $linea_limpia)) {
                    $cond_d_found = true;
                    continue;
                }

                // 3. Verificar la RewriteRule con el target simplificado
                if (preg_match($rule_target_pattern, $linea_limpia)) {
                    $rule_target_found = true;
                }
            }

            // 3. Asignar el resultado final basado en todas las banderas.
            $completo = $engine_on_found && $cond_f_found && $cond_d_found && $rule_target_found;

            if ($completo) {
                $URL_CORTA = $ICONO_EXITO;
            } else {
                $errores = [];
                if (!$engine_on_found)
                    $errores[] = "RewriteEngine On";
                if (!$cond_f_found)
                    $errores[] = "RewriteCond !-f";
                if (!$cond_d_found)
                    $errores[] = "RewriteCond !-d";
                if (!$rule_target_found)
                    $errores[] = "RewriteRule con target 'redireccionarShortLink.php?cod=$1'";

                $URL_CORTA = $ICONO_FALLO;
            }
        }
    }

    echo '
    <html>
    <head>
        <meta charset="utf-8">
        <link id="favicon" rel="shortcut icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/1008/1008917.png">
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp" rel="stylesheet" />
        <script src="https://code.jquery.com/jquery-2.2.4.min.js" integrity="sha256-BbhdlvQf/xTY9gja0Dq3HiwQF8LaCRTXxZKRutelT44=" crossorigin="anonymous"></script>
        <style>
    /* Basic Reset & Body Styles */
    body {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        background-color: #f4f7f6;
        color: #333;
        display: flex;
        min-height: 100vh;
    }
    /* Sidebar Styles */
    .personal-sidenav {
        height: 100%;
        width: 0;
        position: fixed;
        z-index: 1000;
        top: 0;
        left: 0;
        background-color: #2c3e50;
        overflow-x: hidden;
        transition: 0.5s;
        padding-top: 60px;
        box-shadow: 8px 10px 5px rgba(0,0,0,0.05);
    }
    .personal-sidenav.personal-abierto {
        width: 250px;
    }
    .personal-sidenav a {
        padding: 15px 25px;
        text-decoration: none;
        font-size: 18px;
        color: #ecf0f1;
        display: block;
        transition: 0.3s;
    }
    .personal-sidenav a:hover {
        background-color: #34495e;
        color: #ffffff;
    }
    .personal-sidenav .closebtn {
        position: absolute;
        top: 0;
        right: 25px;
        font-size: 36px;
        margin-left: 50px;
        color: #ecf0f1;
    }
    .personal-sidenav .closebtn:hover {
        color: #e74c3c;
    }
    /* Overlay for when sidebar is open */
    .personal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: none;
    }
    .personal-overlay.personal-activo {
        display: block;
    }
    /* Main Content Styles */
    .personal-contenido-principal {
        flex-grow: 1;
        padding: 20px;
        transition: margin-left .5s;
        background-color: #f4f7f6;
        width: 100%; /* Ensure it takes full width initially */
        box-sizing: border-box;
    }
    .personal-contenido-principal.personal-difuminado {
        filter: blur(2px);
        pointer-events: none; /* Disable interaction with blurred content */
    }
    /* Header Bar */
    .personal-header {
        background-color: #ffffff;
        color: #333;
        padding: 15px 20px;
        box-shadow: 8px 10px 5px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        border-radius: 8px;
    }
    .personal-toggle-btn {
        font-size: 24px;
        cursor: pointer;
        background: none;
        border: none;
        color: #333;
        margin-right: 15px;
        transition: color 0.3s;
    }
    .personal-toggle-btn:hover {
        color: #007bff;
    }
    .personal-header h3 {
        margin: 0;
        font-size: 22px;
        color: #2c3e50;
    }
    /* Info Cards */
    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
    }
    .info-card {
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 8px 10px 5px rgba(0,0,0,0.05);
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: transform 0.2s ease-in-out;
        border-left: 5px solid #9fa7afff; /* Default accent color */
    }
    .info-card:hover {
        transform: translateY(-5px);
    }
    .info-card h4 {
        margin-top: 0;
        color: #34495e;
        font-size: 18px;
        display: flex;
        align-items: center;
    }
    .info-card h4 i {
        margin-right: 10px;
        color: #007bff; /* Default icon color */
        font-size: 20px;
    }
    .info-card .status-indicator {
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
        display: inline-flex; /* Use inline-flex for better alignment with image */
        align-items: center;
        gap: 5px; /* Space between text/image if any */
    }
    .status-indicator img {
        height: 25px;
        width: 25px;
    }
    /* Specific Status Colors (example) */
    .status-ok { background-color: #d4edda; color: #155724; } /* Green for good */
    .status-warning { background-color: #fff3cd; color: #856404; } /* Yellow for warning */
    .status-error { background-color: #f8d7da; color: #721c24; } /* Red for error */
    .status-info { background-color: #d1ecf1; color: #0c5460; } /* Blue for info */
    .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 2s linear infinite;
        display: inline-block;
        vertical-align: middle;
        margin-left: 5px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    /* Specific styles for special characters section */
    .special-chars-section {
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 8px 10px 5px rgba(0,0,0,0.05);
        padding: 20px;
        margin-top: 20px;
        border-left: 5px solid #6c757d;
    }
    .special-chars-section h4 {
        color: #34495e;
        margin-bottom: 15px;
    }
    .special-chars-section p {
        margin: 5px 0;
        color: #555;
    }
    /* Email Test Section */
    .email-test-section {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap; /* Allows items to wrap on smaller screens */
    }
    .email-test-section input[type="email"] {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        flex-grow: 1;
        max-width: 250px;
    }
    .email-test-section button {
        padding: 8px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .email-test-section button:hover {
        background-color: #0056b3;
    }
    #respuesta_email {
        font-weight: bold;
        margin-left: 10px; /* Adjust as needed for spacing */
    }
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .personal-header h3 {
            font-size: 18px;
        }
        
        .dashboard-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            padding: 10px;
        }
        .email-test-section {
            flex-direction: column; /* Stack elements vertically on small screens */
            align-items: flex-start;
        }
        .email-test-section input[type="email"] {
            max-width: 100%; /* Take full width on small screens */
            margin-bottom: 10px;
        }
        .email-test-section button {
            width: 100%;
        }
    }
    .loader {
        margin: 5px;
        border: 10px solid #f3f3f3; /* Light grey */
        border-top: 10px solid grey; /* Blue */
        border-radius: 50%;
        width: 15px;
        height: 15px;
        animation: spin 2s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    h4{
        display:flex;
        align-content: center;
        align-items: center;
        fustify-content: flex-start;
    }
    

.circle{
  width:60px;
  height:60px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  color:white;
  font-weight:bold;
  font-family:Arial,sans-serif;
  font-size:12px;   /* smaller text */
  margin:0 auto;
}


.circle.red{background:red}
.circle.yellow{background:Gold}
.circle.green{background:GreenYellow}
.circle.gray{background:Gainsboro}
.circle.orange{background:LightPink}






    
    </style>
    <script>
            // 17. E-MAIL TEST Function
        function email() {
            const emailAddress = document.getElementById("email").value;
            const respuestaEmailSpan = document.getElementById("respuesta_email");
            if (emailAddress) {
                respuestaEmailSpan.innerHTML = "Sending...";
                // This AJAX call needs a "email_test.php" file on your server
                $.ajax({
                    type: "POST",
                    url: "ajaxMailtest.php",
                    data: { correo: emailAddress },
                    success: function(response) {
                        respuestaEmailSpan.innerHTML = response;
                    },
                    error: function() {
                        respuestaEmailSpan.innerHTML = "<span style=\'color:red;\'>Error sending email.</span>";
                    }
                });
            } else {
                respuestaEmailSpan.innerHTML = "><span style=\'color:orange;\'>Please enter an email address.</span>";
            }
        }
        
        
        // ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        function comienzaPapa(){}
        
        var icono = document.getElementById("favicon");
        function PonIconoRojo(){icono.href= "https://cdn-icons-png.flaticon.com/512/1008/1008930.png";}
        function PonIconoAmarillo(){icono.href= "https://cdn-icons-png.flaticon.com/512/1041/1041891.png"; }
        
        $(document).ready(function() { 
		';




    if ($colorTablas == 'red') {

        echo 'PonIconoRojo();';
    }






    if (!file_exists('../.htaccess')) {
        echo '
			    document.getElementById("spanhtacess").innerText="HTCACCESS NOT FOUND";
			    document.getElementById("spanhtacess").style.color="red";  			    			    
			    PonIconoRojo();
            		';
    } else {

        if (strpos(file_get_contents('../.htaccess'), 'ROTATORSOFTWARE marca') !== false) {
            echo '
				    document.getElementById("spanhtacess").innerText = versionHtaccess;  
				    document.getElementById("spanhtacess").style.color="blue";            		
				';
        } else {

            echo '
				    document.getElementById("spanhtacess").innerText="HTCACCESS ALTERED";
				    document.getElementById("spanhtacess").style.color="red";            		
				    PonIconoRojo();
				';
        }
    }

    echo '
        
        
        
            
            const sidenav = document.querySelector(".personal-sidenav");
            const overlay = document.querySelector(".personal-overlay");
            const contenidoPrincipal = document.querySelector(".personal-contenido-principal");
            function closeNav() {
                sidenav.classList.remove("personal-abierto");
                overlay.classList.remove("personal-activo");
                contenidoPrincipal.classList.remove("personal-difuminado");
            }
            overlay.addEventListener("click", closeNav);
            const imagenbuena_js = "https://cdn-icons-png.flaticon.com/512/390/390973.png"; 
            const imagenmala_js = "https://cdn-icons-png.flaticon.com/512/594/594864.png";   
            

        function openNav() {
            sidenav.classList.add("personal-abierto");
            overlay.classList.add("personal-activo");
            contenidoPrincipal.classList.add("personal-difuminado");
        }
            $.ajax({
                type:"POST",
                url:"ajaxCheck.php",
                success: function(response){
                    if(response=="1"){
                        document.getElementById("spanAjax").innerHTML="<img style=' . $imagenbuena . '>";
                        
                    }
                },
                error: function(xhr, status, error){
                    document.getElementById("spanAjax").innerHTML="<img style=' . $imagenmala . '>";
                    document.getElementById("spanAjax").style.background = "yellow";
                    contenedor = document.getElementById("spanAjax").parentElement
                    contenedor.style.borderLeftColor = "red";
                    PonIconoRojo();
                }
            });
        });
    </script>
</head>
<body onload="comienzaPapa()">
    <div class="personal-sidenav">
        <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
        <a href="/web/cawi_monitor.php"><i class="fas fa-chart-line"></i> Monitor de Estudios</a>
        <a href="#"><i class="fas"></i> Configuración</a>
        <a href="#"><i class="fas"></i> Acerca de</a>
    </div>
    <div class="personal-overlay" onclick="closeNav()"></div>
    <div class="personal-contenido-principal">
    <div class="personal-header">
        <button style="color:LightGray;" class="personal-toggle-btn btn" onclick="window.location.replace(window.location.href + \'?Close=1\');">LOG OFF</button>
        <h3>' . $NombreServidor . ' DIAGNOSTICS <span style="color:cornflowerblue;">(' . $tipoDeServer . ' - ' . $GLOBALS['master_size_of_server'] . ')</span></h3>
        <h3 style="color:LightGray;">VERSION ' . $version . '</h3>
    </div>

 



    <br>
    <div class="dashboard-grid">
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>FS 2-HOURS INTENSITY</h4>                        
            <div class="circle gray"></div>            
            <span id="msgIntensidad"></span>
        </div>
   
        <div class="info-card" style="text-align: center; display: block;">
            <h4>PHP SESSION VARIABLES</h4>
            <span class="status-indicator" style="background:' . $sessionTestColor . '; ">
                <img style="height: 25px; width: 25px;" src="' . $sessionTest . '">
            </span>
        </div>
        <div class="info-card" style=" text-align: center; display: block;"> 
            <h4>DATABASE CONNECTION</h4>
            <span class="status-indicator" style="background:' . $colorBD . ';">
                <img style="height: 25px; width: 25px;" src="' . $MySQLActivo . '">
            </span>
        </div>

    
        <div class="info-card" style=" text-align: center; display: block;"> 
            <h4>DATABASE TABLES</h4>
            <span class="status-indicator" style="background:' . $colorBD . ';">
                <img style="height: 25px; width: 25px;" src="' . $MySQExistenTablas . '">
            </span>
        </div>

        

        <div class="info-card" style=" text-align: center; display: block;">
            <h4>FTP SERVER</h4>
            <span class="status-indicator" id="usoFtp"><div class="loader"></div></span>
        </div>        
        <div class="info-card" style=" text-align: center; display: block; border-color:' . $activeSessionColor . '">
            <h4>NUMBER OF PHP SESSIONS</h4>
            <span class="status-indicator" style="color:blue">' . $activeSessionCount . '</span>
            <img style="height: 25px; width: 25px;" src="' . $activeSessionImg . '">
        </div>        
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>PHP ZIP EXTENSION</h4>
            <span class="status-indicator" style="background:white;">
                <img style="height: 25px; width: 25px;" src="' . $zipExtension . '">
            </span>
        </div>        

        <div class="info-card" style=" text-align: center; display: block;">
            <h4>PHP LINUX COMMANDS</h4>
            <span class="status-indicator" style="background:' . $colorLinuxCommands . ';">
                <img style="height: 25px; width: 25px;" src="' . $LinuxCommands . '">
            </span>
        </div>
        



    

        <div class="info-card" style=" text-align: center; display: block;">
            <h4>PHP UNWANTED CACHE</h4>                        
            <span class="status-indicator" id="spanCache"><div class="loader"></div></span>
        </div>        
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>SHORTEN URL SYSTEM:</h4>            
            <span class="status-indicator" >' . $URL_CORTA . '</span>
        </div>
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>CURL LIBRARY</h4>
            <span class="status-indicator" style="background:' . $colorCurl . ';">
                <img style="height: 25px; width: 25px;" src="' . $CurlActivo . '">
            </span>
        </div>        
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>GET GEOLOCATION VIA CURL</h4>            
            <span class="status-indicator" style="background:' . $colorGeo . ';">
                <img style="height: 25px; width: 25px;" src="' . $GeoActivo . '">
            </span>
        </div>

        <div class="info-card" style="text-align: center; display: block;">
            <h4>AJAX SUPPORTED:</h4>
            <span id="spanAjax" class="status-indicator"><div class="loader"></div></span>
        </div>
        <div class="info-card" style="text-align: center; display: block;">
            <h4>FAV ICON</h4>
            <span class="status-indicator" style="background:' . $FavIconColor . '; ">
                <img style="height: 25px; width: 25px;" src="' . $FavIcon . '">
            </span>
        </div>  
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>DISK USAGE</h4>
            <span class="status-indicator" id="usoDisco"><div class="loader"></div></span>
        </div>         
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>VIRUS DETECTION</h4>
            <span class="status-indicator" id="spanVirus"><div class="loader"></div></span>
        </div>           

        
        

</div>






<div class="dashboard-grid">                 
        <div class="info-card" style=" text-align: center; display: block; border-color:' . $VersionPHPColor . '">
            <h4>PHP VERSION</h4>
            <span class="status-indicator" style="color:blue">' . $VersionPHP . '</span>
        </div>        
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>PHP COMMON FUNCTIONS</h4>
            <span class="status-indicator" style="color:blue">' . $VersionFComunesPHP . '</span>
        </div>
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>JS COMMON FUNCTIONS</h4>            
            <span class="status-indicator" style="color:blue">' . $VersionFComunesJS . '</span>
        </div>
        <div class="info-card" style=" text-align: center; display: block;">
            <h4>PUBLIC HTACCESS FILE:</h4>
            <span class="status-indicator" id="spanhtacess"><div class="loader"></div></span>
        </div>
        
</div>




<div class="dashboard-grid">
    <div class="info-card" style=" text-align: center; display: block;">
        <h4><i class="fas fa-envelope"></i> E-MAIL TEST:</h4>
		<div class="email-test-section">
			<input type="email" id="email" placeholder="Enter email to test">
			<button onclick="email()">SEND</button>
			<span id="respuesta_email"></span>
		</div>
    </div>        
</div>


<div class="special-chars-section">
	<h4><i class="fas fa-font"></i> SPECIAL CHARS SUPPORTED</h4>
	<p>Spanish characters required: á é í ó ú Á É Í Ó Ú</p>
	<p>Portuguese characters required: ã á à â ç é ê í õ ó ô ú ü</p>
	<p>These characters are required too: (µ), (¤), (¸)</p>
</div>

<br>

<div class="info-card">    
        <h4>STUDIES</h4>
	<p>
	  <center>



		TOTAL SURVEYS : <span id="totalStudies">???</span><BR>
		TOTAL OFFLINE SURVEYS : <span id="mobileStudies">???</span><BR><BR> <BR>
		
	
		<a href="/web/cawi_monitor.php" target="_blank"
		   style="display: inline-block; width: 350px; height: 50px;
			  background: #08f; color: #fff; border: none;
			  font-size: 20px; font-weight: bold; border-radius: 8px;
			  text-align: center; line-height: 50px; text-decoration: none;">
		  LIST PUBLICATIONS
		</a>




	    
	    
	      	      
	    </button >	    
	    
	    
	  </center>
	</p>
</div>

<br>

<div class="info-card">    
	<h4>CRITICAL FILE SYSTEM</h4><p>';

    show_files("../");


    echo '</p></div>




<BR>

<div class="info-card">    
	<h4>MALEWARE ANALYSIS:</h4><p>';






    //  (*) EN REALIDAD NO ES VERSION SON 2 CARACTERES DEL TAMANO ES PARA CONTROLAR QUE TODOS SEAN LOS MISMOS EN LOS DIFERENTES SERVERS


    echo "&nbsp;SUPECTED: " . $Sospechosos . "<br>";
    echo "&nbsp;INFECTED: " . $Infectados . "<br>";
    echo "&nbsp;MODIFIED FOLDERS: " . $CarpetasAlteradas . "<br>";




    if ($Sospechosos != 0) {
        echo '<script>  PonIconoAmarillo(); </script>';
    }
    if ($Infectados != 0 || $CarpetasAlteradas != 0) {
        echo '<script> PonIconoRojo(); </script>';
    }
    if ($Infectados == 0) {
        echo '<script> document.getElementById("spanVirus").innerHTML="<img style=' . $imagenbuena . '>";</script>';
    } else {
        echo '<script> document.getElementById("spanVirus").innerHTML="<img style=' . $imagenmala . '>";</script>';
    }
    if ($CacheDeFilesPHP == 0) {
        echo '<script> document.getElementById("spanCache").innerHTML="<img style=' . $imagenbuena . '>";</script>';
    } else {
        echo '<script> document.getElementById("spanCache").innerHTML="<img style=' . $imagenmala . '>";</script>';
    }
    if ($MySQLActivo != 'https://cdn-icons-png.flaticon.com/512/390/390973.png') {
        echo '<script> PonIconoRojo(); </script>';
    }
    if ($CurlActivo != 'https://cdn-icons-png.flaticon.com/512/390/390973.png') {
        echo '<script> PonIconoRojo(); </script>';
    }
    if ($GeolActivo != 'https://cdn-icons-png.flaticon.com/512/390/390973.png') {
        echo $GeolActivo . '';
    } else {
        echo '<script> PonIconoRojo(); </script>';
    }
    if ($LinuxCommands != 'https://cdn-icons-png.flaticon.com/512/390/390973.png') {
        echo '<script> PonIconoRojo(); </script>';
    }
    if ($sessionTest != 'https://cdn-icons-png.flaticon.com/512/390/390973.png') {
        echo '<script> PonIconoRojo(); </script>';
    }



    if ($VersionPHPColor == 'red') {
        echo '<script> PonIconoRojo(); </script>';
    }
    if ($FavIconColor == 'red') {
        echo '<script> PonIconoRojo(); </script>';
    }


    $disco = round($disco / 1073741824, 2);


    if ($disco >= $MaxDiskAllowedGB) {
        $discoImg = $imagenmala;
    } else {
        $discoImg = $imagenbuena;
    }





    switch ($GLOBALS['master_size_of_server']) {
        case 'ULTRA-LARGE':
            $FactorAguante = 2;
            if ($GLOBALS['master_type_of_server'] == '0') {
                $limite_estudios_amarillo = 130;
                $limite_estudios_rojo = 160;
            } else {
                $limite_estudios_amarillo = 150;
                $limite_estudios_rojo = 180;
            }
            break;
        case 'LARGE':
            $FactorAguante = 1.5;
            if ($GLOBALS['master_type_of_server'] == '0') {
                $limite_estudios_amarillo = 110;
                $limite_estudios_rojo = 130;
            } else {
                $limite_estudios_amarillo = 120;
                $limite_estudios_rojo = 140;
            }
            break;

        case 'MEDIUM':
            $FactorAguante = 1;
            if ($GLOBALS['master_type_of_server'] == '0') {
                $limite_estudios_amarillo = 90;
                $limite_estudios_rojo = 110;
            } else {
                $limite_estudios_amarillo = 100;
                $limite_estudios_rojo = 130;
            }
            break;

        case 'SMALL':
            $FactorAguante = 0.5;
            $limite_estudios_amarillo = 0;
            $limite_estudios_rojo = 0;
            break;
        default:
            $limite_estudios_amarillo = 9999999;
            $limite_estudios_rojo = 9999999;
            $FactorAguante = 0.1;

    }






    if ($NoEstudios_totales > $limite_estudios_rojo) {
        $iconoEstudiosTotales = $imagenmala;
        echo '<script> PonIconoRojo(); </script>';

    } elseif ($NoEstudios_totales > $limite_estudios_amarillo) {
        $iconoEstudiosTotales = $imagenmala;
        echo '<script> PonIconoAmarillo(); </script>';
    } else {
        $iconoEstudiosTotales = $imagenbuena;
    }






    echo '<script>document.getElementById("usoDisco").innerHTML = "' . $disco . ' GB.<img style=' . $discoImg . '>";


document.getElementById("totalStudies").innerHTML="<b>' . $NoEstudios_totales . '&nbsp;<img style=' . $iconoEstudiosTotales . '></b>";
document.getElementById("mobileStudies").innerHTML="<b>' . $NoEstudios_mobile . '&nbsp;</b>";




document.getElementById("msgIntensidad").innerHTML="' . $AcumFilesTocados_Count . ' files used (' . round($AcumFilesTocados_Bytes / (1024 * 1024), 0) . ' MB)";


const circle = document.querySelector(".circle");


var archivoTocados="' . $AcumFilesTocados_Count . '";
var EstudioTocados="' . $EstudiosTocados . '";




if(EstudioTocados==0){
    // se queda gris
}else{
        if (archivoTocados < ' . (10 * $FactorAguante) . ' ){
        // se queda gris
        
    }else if(archivoTocados< ' . (500 * $FactorAguante) . ' ){
        circle.classList.remove("gray"); circle.classList.add("green");	

    }else if(archivoTocados< ' . (1000 * $FactorAguante) . ' ){
        circle.classList.remove("gray"); circle.classList.add("yellow");

    }else if(archivoTocados< ' . (2000 * $FactorAguante) . ' ){
        circle.classList.remove("gray"); circle.classList.add("orange");
        
    }else{
        circle.classList.remove("gray"); circle.classList.add("red");
    }
}   




</script>';



    // 15 07 2024
    $ftp = pingFTP($_SERVER['HTTP_HOST']);
    if ($ftp == 1) {
        $ftpImg = $imagenbuena;
        $ftpMSG = '';
    } else if ($ftp == 2) {
        $ftpImg = $imagenmala;
        $ftpMSG = 'FTP SERVER ACTIVE, BUT LOGIN FAILS';
    } else {
        $ftpImg = $imagenmala;
        $ftpMSG = 'FTP INACTIVE?';
    }
    echo '<script>document.getElementById("usoFtp").innerHTML = "' . $ftpMSG . '<img style=' . $ftpImg . '>";</script>';

    if ($ftp == 2) {
        echo '<script> PonIconoRojo(); </script>';
    }


    if ($activeSessionColor == 'red') {
        echo '<script> PonIconoRojo(); </script>';
    }


    //if ($URL_CORTA === $ICONO_FALLO || true ) {echo '<script> PonIconoRojo(); </script>';}



    echo '</div><br></body>
    </html>';
}
?>