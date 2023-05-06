<?php
	$log = ("hitcounter.txt");
	// append mode ensures atomic operations
	$fp = fopen($log , "a");
	fwrite($fp , date('Y-m-d H:i:s') . "\n");
	fclose($fp);
?>
