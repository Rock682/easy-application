$html1 = (Invoke-WebRequest -Uri "https://cets.apsche.ap.gov.in/PGCET/PGCET/PGCET_HomePage").Content
$matches1 = [regex]::Matches($html1, '(?si)<a[^>]*href=["'']([^"'']+)["''][^>]*>(.*?)</a>')
foreach ($m in $matches1) {
    if ($m.Groups[2].Value -match "Important") {
        Write-Host "PGCET:" $m.Groups[1].Value
    }
}

$html2 = (Invoke-WebRequest -Uri "https://cets.apsche.ap.gov.in/LAWCET/LAWCET/LAWCET_HomePage").Content
$matches2 = [regex]::Matches($html2, '(?si)<a[^>]*href=["'']([^"'']+)["''][^>]*>(.*?)</a>')
foreach ($m in $matches2) {
    if ($m.Groups[2].Value -match "Important") {
        Write-Host "LAWCET:" $m.Groups[1].Value
    }
}
