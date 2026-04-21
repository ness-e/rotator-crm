<?php
if (!isset($_POST['correo']) || !filter_var($_POST['correo'], FILTER_VALIDATE_EMAIL)) {
    echo 'Invalid or missing email address.';
    exit;
}
$to = $_POST['correo'];
$subject = "Server mail test: " . $_SERVER['HTTP_HOST'];
$Message = "This server works!";

if (mail($to, $subject, $Message)) {
	echo 'Mail was sent, wait a minutes and check your email';
} else {
	echo 'Mail failed! : to: ' . $to . ' Subject: ' . $subject . ' Message: ' . $Message;
}
