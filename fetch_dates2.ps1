$urls = @(
    "https://cets.apsche.ap.gov.in/PGCET/PGCET_HomePages/ImportantDates.aspx",
    "https://cets.apsche.ap.gov.in/LAWCET/LAWCETHomePages/ImportantDates.aspx"
)

$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")

foreach ($url in $urls) {
    Write-Host "=================="
    Write-Host $url
    Write-Host "=================="
    try {
        $html = $wc.DownloadString($url)
        
        $linesFound = 0
        $matchResult = [regex]::Matches($html, '(?si)<tr[^>]*>(.*?)</tr>')
        foreach ($m in $matchResult) {
            $row = $m.Groups[1].Value
            $row = $row -replace '<[^>]+>', ' | '
            $row = $row -replace '\s+', ' '
            $row = $row -replace '\|(\s*\|)+', '|'
            $row = $row.Trim().Trim('|')
            if ($row -match '(202[56]|Date)') {
                Write-Host "TR: $row"
                $linesFound++
            }
        }
        if ($linesFound -lt 2) {
            # fallback printing all text with 2026
            Write-Host "No tables, checking paragraphs."
            $matchResult = [regex]::Matches($html, '(?si)<(p|span|div|strong|li)[^>]*>(.*?)</\1>')
            foreach ($m in $matchResult) {
                $val = $m.Groups[2].Value
                $val = $val -replace '<[^>]+>', ' '
                $val = $val -replace '\s+', ' '
                $val = $val.Trim()
                if ($val -match '202[56]') { Write-Host $val }
            }
        }
    }
    catch {
        Write-Host "Failed: $_"
    }
}
