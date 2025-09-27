for ($i = 1; $i -le 1000; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/payments" -Method POST -ContentType "application/json" -Body '{"orderId":1,"amount":122.0}' -UseBasicParsing
        $log = "$i success: $($response.StatusCode)"
    } catch {
        $log = "$i failure: $($_.Exception.Message)"
    }
    Write-Host $log
    $log | Out-File -FilePath "output.log" -Append
}

