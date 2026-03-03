$urls = @(
    "https://cets.apsche.ap.gov.in/EAPCET/EapcetHomepages/ImportantDates",
    "https://cets.apsche.ap.gov.in/EDCET/EDCETHomePages/ImportantDates",
    "https://cets.apsche.ap.gov.in/ECET/UI/ImportantDates",
    "https://cets.apsche.ap.gov.in/ICET/ICETHomePages/ImportantDates",
    "https://cets.apsche.ap.gov.in/PGECET/UI/ImportantDates",
    "https://cets.apsche.ap.gov.in/PECET/PECETHomePages/ImportantDates",
    "https://cets.apsche.ap.gov.in/PGCET/PGCET/PGCET_HomePage",
    "https://cets.apsche.ap.gov.in/LAWCET/LAWCET/LAWCET_HomePage"
)

foreach ($url in $urls) {
    Write-Host "=================================================="
    Write-Host $url
    Write-Host "=================================================="
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
        $html = $response.Content
        
        $linesFound = 0
        $matches = [regex]::Matches($html, '(?si)<tr[^>]*>(.*?)</tr>')
        foreach ($m in $matches) {
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
            $matches = [regex]::Matches($html, '(?si)<(p|strong|li|span|div)[^>]*>(.*?)</\1>')
            foreach ($m in $matches) {
                $val = $m.Groups[2].Value
                $val = $val -replace '<[^>]+>', ' '
                $val = $val -replace '\s+', ' '
                $val = $val.Trim()
                if ($val -match '202[56]' -and $val -match '(Start|Close|Last|Exam|Issue|Hall|Declaration|Submission|Fee|Notification)') {
                    Write-Host "OTHER: $val"
                }
            }
        }
    } catch {
        Write-Host "Failed: $_"
    }
}
