# 홈 화면 아이콘(PNG)을 만든다: 남색 배경 + "3000" + 1k·2k·3k 색 막대
# 실행: powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$fontPath = Join-Path $root 'node_modules\@expo-google-fonts\fraunces\700Bold\Fraunces_700Bold.ttf'
$outDir = Join-Path $root 'public'

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile($fontPath)
$family = $fonts.Families[0]

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml('#18263F'))

  $font = New-Object System.Drawing.Font $family, ($size * 0.26), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'
  $fmt.LineAlignment = 'Center'
  $rect = New-Object System.Drawing.RectangleF 0, ($size * 0.30), $size, ($size * 0.30)
  $g.DrawString('3000', $font, [System.Drawing.Brushes]::White, $rect, $fmt)

  $bw = $size * 0.16; $bh = $size * 0.045; $gap = $size * 0.03
  $x0 = ($size - ($bw * 3 + $gap * 2)) / 2; $y = $size * 0.66
  $colors = '#5BC497', '#E2A94A', '#E5786A'
  for ($i = 0; $i -lt 3; $i++) {
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($colors[$i]))
    $x = $x0 + $i * ($bw + $gap)
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc($x, $y, $bh, $bh, 90, 180)
    $p.AddArc($x + $bw - $bh, $y, $bh, $bh, 270, 180)
    $p.CloseFigure()
    $g.FillPath($brush, $p)
  }

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-Icon 512 (Join-Path $outDir 'icon-512.png')
New-Icon 192 (Join-Path $outDir 'icon-192.png')
New-Icon 180 (Join-Path $outDir 'apple-touch-icon.png')
Write-Output 'icons done'
