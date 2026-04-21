<?php
/**
 * monitorServer.php - Server Diagnostics JSON API
 * ================================================
 * This file runs on each remote server and returns a JSON report
 * of all health checks. Called remotely by the central dashboard.
 *
 * AUTHENTICATION: Requires a secret token via GET param or Authorization header.
 * USAGE: GET https://domain.com/web/varias/monitorServer.php?token=YOUR_SECRET
 *
 * Based on estructura.php v6.69 — all tests replicated in headless JSON mode.
 * Version: 1.0
 */

// ─── Configuration ──────────────────────────────────────────────────────────────
clearstatcache();
header('Content-Type: application/json; charset=utf-8');
// 1. Deshabilitar caché para HTTP 1.0 (para navegadores y proxies antiguos)
header("Expires: Tue, 01 Jan 2000 00:00:00 GMT"); // Fecha en el pasado
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT"); // Siempre la fecha actual
// 2. Deshabilitar caché para HTTP 1.1 (para navegadores y proxies modernos)
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false); // Para IE
header("Pragma: no-cache"); // Para compatibilidad con HTTP 1.0
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
ini_set('default_charset', 'UTF-8');
ini_set('display_errors', 0);
set_time_limit(120); // 2-minute max execution

// ─── Token Authentication ───────────────────────────────────────────────────────
// Set your secret token here. Change this to something unique per installation.
$MONITOR_SECRET_TOKEN = 'ROTATOR_MONITOR_2026_CHANGE_ME';

$providedToken = $_GET['token'] ?? '';
if (empty($providedToken)) {
    // Also check Authorization: Bearer header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m)) {
        $providedToken = $m[1];
    }
}

if (!hash_equals($MONITOR_SECRET_TOKEN, $providedToken)) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized', 'message' => 'Invalid or missing token']);
    exit;
}

// ─── Load server-specific configuration ─────────────────────────────────────────
// monitorServer.php lives at: {webroot}/tests/monitorServer.php
// estructura.php lives at:    {webroot}/estructura.php
// So:
//   $basePath             = {webroot}/tests/
//   $webRoot              = {webroot}/              ($basePath . '/../')
//   $serverRoot           = {webroot}/../../        ($basePath . '/../../')  ← where favicon, .htaccess live
//   rotator_masters       = {webroot}/../../rotator_masters/

$basePath = dirname(__FILE__); // …/tests
$webRoot = realpath($basePath . '/../'); // public_html root
$serverRoot = realpath($basePath . '/../../'); // one level above public_html

// Masters config (same depth as estructura.php uses: dirname(__FILE__) . '/../../rotator_masters/masters.php')
// estructura.php is at webRoot, so ../../ = serverRoot
$mastersPath = realpath($serverRoot . '/rotator_masters/masters.php');
// funciones_comunes.php is at webRoot/web/varias/funciones_comunes.php
$funcionesComunesPath = realpath($serverRoot . '/web/varias/funciones_comunes.php');

$configLoaded = false;
if ($mastersPath && file_exists($mastersPath)) {
    @include_once($mastersPath);
    $configLoaded = true;
}
if ($funcionesComunesPath && file_exists($funcionesComunesPath)) {
    @include_once($funcionesComunesPath);
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function folderSizeRecursive($dir)
{
    $size = 0;
    foreach (glob(rtrim($dir, '/') . '/*', GLOB_NOSORT) as $each) {
        $size += is_file($each) ? filesize($each) : folderSizeRecursive($each);
    }
    return $size;
}

// Alias para compatibilidad con estructura.php
function folderSize($dir)
{
    return folderSizeRecursive($dir);
}

function getClientIpMonitor()
{
    $keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($keys as $k) {
        if (!empty($_SERVER[$k])) {
            $ip = explode(',', $_SERVER[$k]);
            return trim($ip[0]);
        }
    }
    return 'unknown';
}

// ─── Start collecting results ───────────────────────────────────────────────────
$startTime = microtime(true);
$results = [];
$overallStatus = 'ok'; // ok, warning, error

function setStatus($level)
{
    global $overallStatus;
    if ($level === 'error') {
        $overallStatus = 'error';
    } elseif ($level === 'warning' && $overallStatus !== 'error') {
        $overallStatus = 'warning';
    }
}

// ─── Server identity ────────────────────────────────────────────────────────────
$host = $_SERVER['HTTP_HOST'] ?? 'unknown';
$subdominio = explode('.', $host);
$serverName = strtoupper($subdominio[0]);
$serverType = $GLOBALS['master_type_of_server'] ?? 'unknown';
$serverSize = $GLOBALS['master_size_of_server'] ?? 'unknown';

$typeLabels = ['0' => 'CLOUD', '1' => 'PRIVATE', '2' => 'OWN', '3' => 'POOL'];
$serverTypeLabel = $typeLabels[$serverType] ?? 'UNDEFINED';

$results['server'] = [
    'name' => $serverName,
    'host' => $host,
    'type' => $serverTypeLabel,
    'size' => $serverSize,
    'ip' => getClientIpMonitor(),
    'configLoaded' => $configLoaded,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: FS 2-HOURS INTENSITY
// ═══════════════════════════════════════════════════════════════════════════════
$fsIntensity = ['filesModified' => 0, 'bytesModified' => 0, 'status' => 'ok'];
// $webRoot already set above

if ($webRoot) {
    $fsIterator = function ($dir) use (&$fsIterator, &$fsIntensity) {
        $items = @scandir($dir);
        if (!$items)
            return;
        foreach ($items as $item) {
            if ($item === '.' || $item === '..')
                continue;
            $fullPath = "$dir/$item";
            if (is_file($fullPath) && filemtime($fullPath) >= time() - 7200) {
                $fsIntensity['filesModified']++;
                $fsIntensity['bytesModified'] += filesize($fullPath);
            }
            if (is_dir($fullPath) && substr($item, 0, 1) !== '.') {
                $fsIterator($fullPath);
            }
        }
    };
    $fsIterator($webRoot);
    $fsIntensity['bytesMB'] = round($fsIntensity['bytesModified'] / (1024 * 1024), 1);
}
$results['fs_2hours_intensity'] = $fsIntensity;

// ═══════════════════════════════════════════════════════════════════════════════
// TEST: AJAX SUPPORT (test file existence)
// ═══════════════════════════════════════════════════════════════════════════════
$ajaxCheckPath = $basePath . '/ajaxCheck.php';
$results['ajax_supported'] = [
    'status' => file_exists($ajaxCheckPath) ? 'ok' : 'warning',
    'fileExists' => file_exists($ajaxCheckPath),
    'fileName' => 'ajaxCheck.php'
];


// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: PHP SESSION VARIABLES
// ═══════════════════════════════════════════════════════════════════════════════
@session_start();
$sessionActive = session_status() === PHP_SESSION_ACTIVE;
$results['php_session_variables'] = [
    'status' => $sessionActive ? 'ok' : 'error',
    'active' => $sessionActive,
];
if (!$sessionActive)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════════════════════════
$dbOk = false;
$dbError = null;
try {
    $dbHost = $GLOBALS['master_host'] ?? null;
    $dbName = $GLOBALS['master_db'] ?? null;
    $dbUser = $GLOBALS['master_user'] ?? null;
    $dbPass = $GLOBALS['master_pass'] ?? null;
    if ($dbHost && $dbName) {
        $dsn = "mysql:host=$dbHost;dbname=$dbName;charset=utf8";
        $pdo = new PDO($dsn, $dbUser, $dbPass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $dbOk = true;
    } else {
        $dbError = 'Database credentials not configured';
    }
} catch (Exception $e) {
    $dbError = $e->getMessage();
}
$results['database_connection'] = [
    'status' => $dbOk ? 'ok' : 'error',
    'connected' => $dbOk,
    'error' => $dbError,
];
if (!$dbOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 4: DATABASE TABLES
// ═══════════════════════════════════════════════════════════════════════════════
$tablesOk = false;
$tableCount = 0;
if ($dbOk) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'Tbl_estudios_offline'");
        $tablesOk = $stmt && $stmt->rowCount() > 0;
        $stmtAll = $pdo->query("SHOW TABLES");
        $tableCount = $stmtAll ? $stmtAll->rowCount() : 0;
    } catch (Exception $e) {
    }
}
$results['database_tables'] = [
    'status' => $tablesOk ? 'ok' : 'error',
    'mainTableExists' => $tablesOk,
    'totalTables' => $tableCount,
];
if (!$tablesOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 5: FTP SERVER
// ═══════════════════════════════════════════════════════════════════════════════
$ftpStatus = 'error';
$ftpMessage = '';
if (function_exists('ftp_connect')) {
    $ftpHost = $_SERVER['HTTP_HOST'] ?? '';
    $connId = @ftp_connect($ftpHost, 21, 10);
    if ($connId) {
        $loginResult = @ftp_login($connId, 'usrftpversta@' . $ftpHost, 'Rotator123!');
        if ($loginResult) {
            $ftpStatus = 'ok';
            $ftpMessage = 'Connected and login successful';
        } else {
            $ftpStatus = 'warning';
            $ftpMessage = 'FTP server active but login failed';
            setStatus('warning');
        }
        @ftp_close($connId);
    } else {
        $ftpStatus = 'error';
        $ftpMessage = 'Cannot connect to FTP server';
        setStatus('error');
    }
} else {
    $ftpMessage = 'FTP extension not loaded';
    setStatus('error');
}
$results['ftp_server'] = [
    'status' => $ftpStatus,
    'message' => $ftpMessage,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 6: NUMBER OF PHP SESSIONS
// ═══════════════════════════════════════════════════════════════════════════════
$sessionPath = ini_get('session.save_path');
$sessionFiles = @glob("$sessionPath/sess_*");
$activeSessionCount = 0;
$maxLifetime = ini_get('session.gc_maxlifetime');
if (is_array($sessionFiles)) {
    foreach ($sessionFiles as $file) {
        if (filemtime($file) + $maxLifetime > time())
            $activeSessionCount++;
    }
}

// Determine threshold based on server size
$sessionLimit = 100;
switch ($serverSize) {
    case 'ULTRA-LARGE':
        $sessionLimit = 1500;
        break;
    case 'LARGE':
        $sessionLimit = 800;
        break;
    case 'MEDIUM':
        $sessionLimit = 500;
        break;
}
$sessionStatus = $activeSessionCount < $sessionLimit ? 'ok' : 'error';
if ($sessionStatus === 'error')
    setStatus('error');

$results['php_sessions_count'] = [
    'status' => $sessionStatus,
    'count' => $activeSessionCount,
    'limit' => $sessionLimit,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 7: PHP ZIP EXTENSION
// ═══════════════════════════════════════════════════════════════════════════════
$zipLoaded = class_exists('ZipArchive');
$results['php_zip_extension'] = [
    'status' => $zipLoaded ? 'ok' : 'error',
    'loaded' => $zipLoaded,
];
if (!$zipLoaded)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 8: PHP LINUX COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════
$linuxOk = false;
try {
    $testFile = $webRoot . '/TestLinux_monitor.txt';
    if (file_exists($testFile))
        @unlink($testFile);
    @system("echo 1 > $testFile");
    if (file_exists($testFile)) {
        $linuxOk = true;
        @unlink($testFile);
    }
} catch (Exception $e) {
}
$results['php_linux_commands'] = [
    'status' => $linuxOk ? 'ok' : 'error',
    'available' => $linuxOk,
];
if (!$linuxOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 9: PHP UNWANTED CACHE
// ═══════════════════════════════════════════════════════════════════════════════
$cacheOk = true;
$dumpFile = $webRoot . '/testCache_DUMP_monitor.php';
@file_put_contents($dumpFile, '1');
$read1 = @file_get_contents($dumpFile);
@file_put_contents($dumpFile, '2');
$read2 = @file_get_contents($dumpFile);
if ($read1 === $read2)
    $cacheOk = false;
@unlink($dumpFile);
$results['php_unwanted_cache'] = [
    'status' => $cacheOk ? 'ok' : 'error',
    'cacheDetected' => !$cacheOk,
];
if (!$cacheOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 10: SHORTEN URL SYSTEM
// estructura.php uses '../.htaccess' (one level up from webroot) = serverRoot
// ═══════════════════════════════════════════════════════════════════════════════
$shortenOk = false;
$htaccessPath = realpath($webRoot . '/.htaccess');
if ($htaccessPath && is_readable($htaccessPath)) {
    $lines = @file($htaccessPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines) {
        $flags = ['engine' => false, 'condF' => false, 'condD' => false, 'rule' => false];
        foreach ($lines as $line) {
            $l = trim($line);
            if (strcasecmp($l, 'RewriteEngine On') === 0)
                $flags['engine'] = true;
            if (preg_match('/^RewriteCond\s+%\{REQUEST_FILENAME\}\s+!\-f/i', $l))
                $flags['condF'] = true;
            if (preg_match('/^RewriteCond\s+%\{REQUEST_FILENAME\}\s+!\-d/i', $l))
                $flags['condD'] = true;
            if (preg_match('/^RewriteRule\s+.*redireccionarShortLink\.php\?cod=\$1\s+\[L\]/i', $l))
                $flags['rule'] = true;
        }
        $shortenOk = $flags['engine'] && $flags['condF'] && $flags['condD'] && $flags['rule'];
    }
}
$results['shorten_url_system'] = [
    'status' => $shortenOk ? 'ok' : 'warning',
    'configured' => $shortenOk,
];
if (!$shortenOk)
    setStatus('warning');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 11: CURL LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════
$curlOk = false;
if (function_exists('curl_init')) {
    $ch = curl_init('https://www.google.com');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $resp = curl_exec($ch);
    $curlOk = $resp !== false;
    curl_close($ch);
}
$results['curl_library'] = [
    'status' => $curlOk ? 'ok' : 'error',
    'functional' => $curlOk,
];
if (!$curlOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 12: GET GEOLOCATION VIA CURL
// ═══════════════════════════════════════════════════════════════════════════════
$geoOk = false;
if (function_exists('curl_init')) {
    $ch = curl_init('https://get.geojs.io/v1/ip/geo/51.15.0.0.json');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $json = curl_exec($ch);
    $obj = @json_decode($json, true);
    $geoOk = is_array($obj) && !empty($obj);
    curl_close($ch);
}
$results['geolocation_curl'] = [
    'status' => $geoOk ? 'ok' : 'error',
    'functional' => $geoOk,
];
if (!$geoOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 13: AJAX SUPPORTED (test file existence)
// estructura.php uses 'ajaxCheck.php' (same dir = webRoot)
// ═══════════════════════════════════════════════════════════════════════════════
$ajaxFile = $basePath . '/ajaxCheck.php';
$ajaxOk = file_exists($ajaxFile);
$results['ajax_supported'] = [
    'status' => $ajaxOk ? 'ok' : 'warning',
    'fileExists' => $ajaxOk,
    'note' => 'Runtime AJAX test requires browser; file presence checked only.',
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 14: FAV ICON
// estructura.php uses '../favicon.ico' (one level up from webroot) = serverRoot
// ═══════════════════════════════════════════════════════════════════════════════

$faviconPath = $webRoot . '/favicon.ico';
$faviconOk = file_exists($faviconPath);
$results['fav_icon'] = [
    'status' => $faviconOk ? 'ok' : 'error',
    'exists' => $faviconOk,
];
if (!$faviconOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 15: DISK USAGE — scan serverRoot (same as estructura.php which scans from 1 level up)
// ═══════════════════════════════════════════════════════════════════════════════
$MaxDiskAllowedGB = 75;
$diskBytes = 0;
$diskScanTarget = $serverRoot ?: $webRoot;
if ($diskScanTarget) {
    // Use du command for speed if available, otherwise fallback to PHP
    $duOutput = @shell_exec("du -sb " . escapeshellarg($diskScanTarget) . " 2>/dev/null");
    if ($duOutput && preg_match('/^(\d+)/', $duOutput, $m)) {
        $diskBytes = (int) $m[1];
    } else {
        $diskBytes = folderSizeRecursive($diskScanTarget);
    }
}
$diskGB = round($diskBytes / 1073741824, 2);
$diskOk = $diskGB < $MaxDiskAllowedGB;
$results['disk_usage'] = [
    'status' => $diskOk ? 'ok' : 'error',
    'usedGB' => $diskGB,
    'limitGB' => $MaxDiskAllowedGB,
];
if (!$diskOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 16: VIRUS DETECTION (malware scan)
// ═══════════════════════════════════════════════════════════════════════════════

// Inicializar variables globales para que la función show_files de estructura.php 
// funcione sin dar errores de "undefined variable".
$Sospechosos = 0;
$Infectados = 0;
$CarpetasAlteradas = 0;
$disco = 0;
$discoImg = 0;
$carpetaDeEstudioPosible = ['vertea', 'versta', 'verpro', 'verind', 'verent', 'veremp', 'verdon', 'veracp', 'veracm', 'private'];
$NoEstudios_totales = 0;
$NoEstudios_mobile = 0;
$AcumFilesTocados_Bytes = 0;
$AcumFilesTocados_Count = 0;
$EstudiosTocados = 0;

clearstatcache(); // Limpia la caché interna de PHP para filesize(), filemtime() e is_dir()

ob_start(); // Captura los 'echo' de show_files para no romper el formato JSON de salida del monitor

// ====================================================================================================================
// ⬇⬇⬇ [COPIA Y PEGA AQUI TODA LA FUNCION "show_files" DESDE estructura.php] ⬇⬇⬇
//
// 1. Ve al archivo estructura.php
// 2. Copia toda la función empezando por: function show_files($start) { ...
// 3. Pégala aquí, reemplazando la función vacía que está abajo.
//
// No necesitas quitar los "echo" o el código HTML, la función ob_start() de arriba los ocultará en este script JSON.
// ====================================================================================================================

function show_files($start)
{
    global $Sospechosos, $Infectados, $CarpetasAlteradas, $disco, $discoImg, $carpetaDeEstudioPosible, $NoEstudios_totales, $NoEstudios_mobile, $AcumFilesTocados_Bytes, $AcumFilesTocados_Count, $EstudiosTocados;

    $discoImg = "<div class='loader'></div>";
    $contents = @scandir($start);
    if ($contents === false) {
        return;
    }
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
            ($item != "monitorServer.php" && $item != "cawi_monitor.php" && $item != "estructura.php")
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
                        case "taskmanager":
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
                    case "monitorServer.php":
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
                    case "ajax_upload_blobs.php":
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
                    case "test_api.php":
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
// ====================================================================================================================
// ⬆⬆⬆ [FIN DE LA FUNCION show_files] ⬆⬆⬆
// ====================================================================================================================

$malwareScanRoot = $webRoot;
if ($malwareScanRoot) {
    show_files($malwareScanRoot);
}

$malwareHtml = ob_get_clean(); // Captura los 'echo' de show_files para retornarlo en JSON y limpia el buffer

$malware = [
    'suspected' => $Sospechosos,
    'infected' => $Infectados,
    'modifiedFolders' => $CarpetasAlteradas,
    'status' => 'ok',
    'detailsHtml' => $malwareHtml
];

if ($malware['infected'] > 0) {
    $malware['status'] = 'error';
    setStatus('error');
} elseif ($malware['suspected'] > 0 || $malware['modifiedFolders'] > 0) {
    $malware['status'] = 'warning';
    setStatus('warning');
}

$results['virus_detection'] = $malware;
$results['malware_analysis'] = $malware; // Alias for backwards compatibility

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 17: PHP VERSION
// ═══════════════════════════════════════════════════════════════════════════════
$phpVer = phpversion();
$phpVersionOk = version_compare($phpVer, '8.1', '>=');
$results['php_version'] = [
    'status' => $phpVersionOk ? 'ok' : 'error',
    'version' => $phpVer,
    'minimum' => '8.1',
];
if (!$phpVersionOk)
    setStatus('error');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 18: PHP COMMON FUNCTIONS (version)
// funciones_comunes.php lives at webRoot/web/varias/funciones_comunes.php
// ═══════════════════════════════════════════════════════════════════════════════
$phpFuncVersion = 'N/A';
$phpFuncPath = $funcionesComunesPath ?: realpath($webRoot . '/web/varias/funciones_comunes.php');
if ($phpFuncPath && file_exists($phpFuncPath)) {
    $content = @file_get_contents($phpFuncPath);
    if ($content && preg_match('/VERSION:\s*([0-9.]+)/', $content, $m)) {
        $phpFuncVersion = $m[1];
    }
}
$results['php_common_functions'] = [
    'status' => 'info',
    'version' => $phpFuncVersion,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 19: JS COMMON FUNCTIONS (version)
// funciones_comunes.js lives at webRoot/web/varias/funciones_comunes.js
// ═══════════════════════════════════════════════════════════════════════════════
$jsFuncVersion = 'N/A';
$jsFuncPath = realpath($webRoot . '/web/varias/funciones_comunes.js');
if ($jsFuncPath && file_exists($jsFuncPath)) {
    $content = @file_get_contents($jsFuncPath);
    if ($content && preg_match('/VERSION:\s*([0-9.]+)/', $content, $m)) {
        $jsFuncVersion = $m[1];
    }
}
$results['js_common_functions'] = [
    'status' => 'info',
    'version' => $jsFuncVersion,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 20: PUBLIC HTACCESS FILE
// estructura.php uses '../.htaccess' (one level up from webroot) = serverRoot
// ═══════════════════════════════════════════════════════════════════════════════
$htaccessStatus = 'error';
$htaccessInfo = '';
$publicHtaccess = $webRoot . '/.htaccess';
if (!$publicHtaccess || !file_exists($publicHtaccess)) {
    $htaccessInfo = 'HTACCESS NOT FOUND';
    setStatus('error');
} else {
    $htContent = @file_get_contents($publicHtaccess);
    if (strpos($htContent, 'ROTATORSOFTWARE marca') !== false) {
        preg_match('/VERSION (\d+\.\d+)/', $htContent, $vm);
        $htaccessStatus = 'ok';
        $htaccessInfo = 'Version ' . ($vm[1] ?? 'unknown');
    } else {
        $htaccessInfo = 'HTACCESS ALTERED - Not Rotator standard';
        setStatus('error');
    }
    // Check charset directive
    if (strpos($htContent, 'php_value default_charset "UTF-8"') === false) {
        $htaccessInfo .= ' | Missing UTF-8 charset directive';
        setStatus('warning');
    }
}
$results['public_htaccess'] = [
    'status' => $htaccessStatus,
    'info' => $htaccessInfo,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 21: E-MAIL TEST
// ═══════════════════════════════════════════════════════════════════════════════
$ajaxMailPath = $basePath . '/ajaxMailtest.php';
$mailOk = function_exists('mail');
$mailFileExists = file_exists($ajaxMailPath);

$results['email_test'] = [
    'status' => ($mailOk && $mailFileExists) ? 'ok' : ($mailOk ? 'warning' : 'error'),
    'mailFunctionAvailable' => $mailOk,
    'fileExists' => $mailFileExists,
    'note' => 'Mail function availability check and ajaxMailtest.php presence.',
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 22: SPECIAL CHARS SUPPORTED
// ═══════════════════════════════════════════════════════════════════════════════
$testChars = 'á é í ó ú Á É Í Ó Ú ã à â ç ê õ ô ü µ ¤ ¸';
$encoded = mb_detect_encoding($testChars, 'UTF-8', true);
$charsetOk = $encoded === 'UTF-8';
$results['special_chars_supported'] = [
    'status' => $charsetOk ? 'ok' : 'warning',
    'encoding' => $encoded ?: 'unknown',
    'testString' => $testChars,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 23: STUDIES (Count) — studies are at webRoot/web/{type}/{study}
// ═══════════════════════════════════════════════════════════════════════════════
$studyFolders = ['vertea', 'versta', 'verpro', 'verind', 'verent', 'veremp', 'verdon', 'veracp', 'veracm', 'private'];
$totalStudies = 0;
$mobileStudies = 0;
$todayActive = 0;

if ($webRoot) {
    foreach ($studyFolders as $sf) {
        $sfPath = $webRoot . '/web/' . $sf;
        if (!is_dir($sfPath))
            continue;
        $subDirs = @scandir($sfPath);
        if (!$subDirs)
            continue;
        foreach ($subDirs as $sd) {
            if ($sd === '.' || $sd === '..' || !is_dir("$sfPath/$sd"))
                continue;
            if (strpos($sd, '_docs') !== false || strpos($sd, 'shr_') !== false)
                continue;
            $totalStudies++;
            if (strpos($sd, 'off_') !== false)
                $mobileStudies++;
            $actFile = "$sfPath/$sd/actividad.txt";
            if (file_exists($actFile) && date('Y-m-d', filemtime($actFile)) === date('Y-m-d')) {
                $todayActive++;
            }
        }
    }
}

// Determine study limits
$studyLimitYellow = 9999;
$studyLimitRed = 9999;
switch ($serverSize) {
    case 'ULTRA-LARGE':
        $studyLimitRed = ($serverType == '0') ? 160 : 180;
        $studyLimitYellow = ($serverType == '0') ? 130 : 150;
        break;
    case 'LARGE':
        $studyLimitRed = ($serverType == '0') ? 130 : 140;
        $studyLimitYellow = ($serverType == '0') ? 110 : 120;
        break;
    case 'MEDIUM':
        $studyLimitRed = ($serverType == '0') ? 110 : 130;
        $studyLimitYellow = ($serverType == '0') ? 90 : 100;
        break;
}

$studyStatus = 'ok';
if ($totalStudies > $studyLimitRed) {
    $studyStatus = 'error';
    setStatus('error');
} elseif ($totalStudies > $studyLimitYellow) {
    $studyStatus = 'warning';
    setStatus('warning');
}

$results['studies'] = [
    'status' => $studyStatus,
    'total' => $totalStudies,
    'mobile' => $mobileStudies,
    'activeToday' => $todayActive,
    'limitYellow' => $studyLimitYellow,
    'limitRed' => $studyLimitRed,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 24: APCu AVAILABILITY (NEW)
// ═══════════════════════════════════════════════════════════════════════════════
$apcuLoaded = extension_loaded('apcu');
// The correct ini key for APCu is 'apc.enabled' (CLI) or check function availability directly
$apcuEnabled = $apcuLoaded && function_exists('apcu_store');
// Check ini — APCu uses 'apc.enabled' in some configs, 'apcu.enabled' in others
if ($apcuEnabled) {
    $iniEnabled = ini_get('apc.enabled');
    if ($iniEnabled === false || $iniEnabled === '') {
        // Try alternative key
        $iniEnabled = ini_get('apcu.enabled');
    }
    // If ini returns empty/false, still trust function_exists — it's loaded and callable
    $apcuEnabled = true; // function exists = enabled
}
$apcuFunctional = false;
if ($apcuEnabled && function_exists('apcu_store')) {
    $testKey = 'monitor_apcu_' . uniqid();
    $stored = @apcu_store($testKey, 'ok', 5);
    if ($stored !== false) {
        $fetched = @apcu_fetch($testKey, $success);
        $apcuFunctional = ($fetched === 'ok' && $success);
        @apcu_delete($testKey);
    }
}
$results['apcu_availability'] = [
    'status' => $apcuFunctional ? 'ok' : ($apcuLoaded ? 'warning' : 'error'),
    'loaded' => $apcuLoaded,
    'enabled' => $apcuEnabled,
    'functional' => $apcuFunctional,
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 25: POST >100MB SUPPORT (NEW)
// ═══════════════════════════════════════════════════════════════════════════════
$postMaxSize = ini_get('post_max_size');
$uploadMaxSize = ini_get('upload_max_filesize');

// Convert to bytes for comparison
function parsePhpSize($s)
{
    $s = trim($s);
    $last = strtolower(substr($s, -1));
    $val = (int) $s;
    switch ($last) {
        case 'g':
            $val *= 1024 * 1024 * 1024;
            break;
        case 'm':
            $val *= 1024 * 1024;
            break;
        case 'k':
            $val *= 1024;
            break;
    }
    return $val;
}

$postBytes = parsePhpSize($postMaxSize);
$uploadBytes = parsePhpSize($uploadMaxSize);
$threshold = 100 * 1024 * 1024; // 100 MB

$postOk = $postBytes >= $threshold;
$results['post_100mb_support'] = [
    'status' => $postOk ? 'ok' : 'error',
    'post_max_size' => $postMaxSize,
    'upload_max_filesize' => $uploadMaxSize,
    'post_max_bytes' => $postBytes,
    'meetsThreshold' => $postOk,
    'thresholdMB' => 100,
];
if (!$postOk)
    setStatus('warning');

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY & OUTPUT
// ═══════════════════════════════════════════════════════════════════════════════
$elapsed = round((microtime(true) - $startTime) * 1000);

// ── Convert tests object → array of { name, status, message } ──────────────
$testLabels = [
    'fs_2hours_intensity' => 'FS 2-Hours Intensity',
    'php_session_variables' => 'PHP Session Variables',
    'database_connection' => 'Database Connection',
    'database_tables' => 'Database Tables',
    'ftp_server' => 'FTP Server',
    'php_sessions_count' => 'Number of PHP Sessions',
    'php_zip_extension' => 'PHP ZIP Extension',
    'php_linux_commands' => 'PHP Linux Commands',
    'php_unwanted_cache' => 'PHP Unwanted Cache',
    'shorten_url_system' => 'Shorten URL System',
    'curl_library' => 'cURL Library',
    'geolocation_curl' => 'Get Geolocation via cURL',
    'ajax_supported' => 'AJAX Supported',
    'mail_test_supported' => 'Email Test Supported',
    'fav_icon' => 'Favicon',
    'disk_usage' => 'Disk Usage',
    'virus_detection' => 'Virus Detection',
    'malware_analysis' => 'Malware Analysis',
    'php_version' => 'PHP Version',
    'php_common_functions' => 'PHP Common Functions',
    'js_common_functions' => 'JS Common Functions',
    'public_htaccess' => 'Public .htaccess File',
    'email_test' => 'E-Mail Test',
    'special_chars_supported' => 'Special Chars Supported',
    'studies' => 'Studies (Counts)',
    'apcu_availability' => 'APCu Availability',
    'post_100mb_support' => 'POST >100MB Support',
];

$testsArray = [];
$okCount = 0;
$warnCount = 0;
$errCount = 0;

foreach ($results as $key => $data) {
    if ($key === 'server')
        continue;

    $status = $data['status'] ?? 'ok';
    // Normalize 'info' to 'ok' for display purposes
    if ($status === 'info')
        $status = 'ok';

    // Build a human-friendly message
    $message = '';
    switch ($key) {
        case 'fs_2hours_intensity':
            $message = ($data['filesModified'] ?? 0) . ' archivos modificados en las últimas 2h (' . ($data['bytesMB'] ?? 0) . ' MB)';
            break;
        case 'php_session_variables':
            $message = $data['active'] ? 'Sesión PHP activa' : 'No se pudo iniciar sesión PHP';
            break;
        case 'database_connection':
            $message = $data['connected'] ? 'Conexión a base de datos exitosa' : ('Error: ' . ($data['error'] ?? 'desconocido'));
            break;
        case 'database_tables':
            $message = $data['mainTableExists'] ? ("Tabla principal OK · {$data['totalTables']} tablas en total") : 'Tabla principal no encontrada';
            break;
        case 'ftp_server':
            $message = $data['message'] ?? '';
            break;
        case 'php_sessions_count':
            $message = "Sesiones activas: {$data['count']} / límite: {$data['limit']}";
            break;
        case 'php_zip_extension':
            $message = $data['loaded'] ? 'ZipArchive cargado' : 'ZipArchive no disponible';
            break;
        case 'php_linux_commands':
            $message = $data['available'] ? 'Comandos shell disponibles' : 'No se pueden ejecutar comandos shell';
            break;
        case 'php_unwanted_cache':
            $message = $data['cacheDetected'] ? 'Caché indeseable detectado en el servidor' : 'Sin caché detectado';
            break;
        case 'shorten_url_system':
            $message = $data['configured'] ? '.htaccess configurado para URLs cortas' : '.htaccess no tiene reglas de URL corta';
            break;
        case 'curl_library':
            $message = $data['functional'] ? 'cURL funcional (Google OK)' : 'cURL no disponible o sin acceso externo';
            break;
        case 'geolocation_curl':
            $message = $data['functional'] ? 'GeoJS responde correctamente' : 'No se pudo obtener geolocalización';
            break;
        case 'ajax_supported':
            $message = $data['fileExists'] ? 'ajaxCheck.php encontrado' : 'ajaxCheck.php no encontrado';
            break;
        case 'fav_icon':
            $message = $data['exists'] ? 'favicon.ico encontrado' : 'favicon.ico no encontrado';
            break;
        case 'disk_usage':
            $message = "Uso: {$data['usedGB']} GB / límite: {$data['limitGB']} GB";
            break;
        case 'virus_detection':
        case 'malware_analysis':
            if (($data['infected'] ?? 0) == 0 && ($data['suspected'] ?? 0) == 0 && ($data['modifiedFolders'] ?? 0) == 0) {
                $message = 'Sin malware detectado';
            } else {
                $message = "Infectados: " . ($data['infected'] ?? 0) . " · Sospechosos: " . ($data['suspected'] ?? 0) . " · Carpetas mod: " . ($data['modifiedFolders'] ?? 0);
            }
            break;
        case 'php_version':
            $message = "PHP {$data['version']} (mínimo {$data['minimum']})";
            break;
        case 'php_common_functions':
            $message = "Versión: {$data['version']}";
            break;
        case 'js_common_functions':
            $message = "Versión: {$data['version']}";
            break;
        case 'public_htaccess':
            $message = $data['info'] ?? '';
            break;
        case 'email_test':
            $message = $data['mailFunctionAvailable'] ? 'Función mail() disponible' : 'Función mail() no disponible';
            if (!$data['fileExists'])
                $message .= ' · ajaxMailtest.php NO encontrado';
            break;
        case 'special_chars_supported':
            $message = "Encoding detectado: " . ($data['encoding'] ?? 'desconocido');
            break;
        case 'studies':
            $message = "Total: {$data['total']} · Móviles: {$data['mobile']} · Activos hoy: {$data['activeToday']}";
            break;
        case 'apcu_availability':
            $message = $data['functional'] ? 'APCu cargado, habilitado y funcional' : ($data['loaded'] ? 'APCu cargado pero no operativo' : 'APCu no disponible');
            break;
        case 'post_100mb_support':
            $message = "post_max_size: {$data['post_max_size']} | upload_max_filesize: {$data['upload_max_filesize']}";
            break;
    }

    switch ($status) {
        case 'ok':
            $okCount++;
            break;
        case 'warning':
            $warnCount++;
            break;
        case 'error':
            $errCount++;
            break;
    }

    // Skip the malware_analysis alias to avoid duplicate
    if ($key === 'malware_analysis')
        continue;

    $testsArray[] = [
        'key' => $key,
        'name' => $testLabels[$key] ?? $key,
        'status' => $status,
        'message' => $message,
        'raw' => $data,
    ];
}

$output = [
    'monitorVersion' => '1.0',
    'estructuraVersion' => '6.69',
    'generatedAt' => date('c'),
    'elapsedMs' => $elapsed,
    'overallStatus' => $overallStatus,
    'summary' => [
        'ok' => $okCount,
        'warnings' => $warnCount,
        'errors' => $errCount,
        'total' => $okCount + $warnCount + $errCount,
    ],
    'serverInfo' => [
        'hostname' => $results['server']['host'] ?? '',
        'phpVersion' => phpversion(),
        'os' => PHP_OS,
        'name' => $results['server']['name'] ?? '',
    ],
    'tests' => $testsArray,
];

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
