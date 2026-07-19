param(
  [string]$Url = "http://127.0.0.1:3000",
  [string]$Output = "output/demo-video/adaptive-textbook-demo.webm",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$OutputDir = Join-Path $ProjectRoot "output\demo-video"
$StepsDir = Join-Path $OutputDir ".steps"
$CliPrefix = @("--yes", "--package", "@playwright/cli", "playwright-cli")

function Invoke-PwCli {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
  )

  if ($DryRun) {
    Write-Host "npx $($CliPrefix -join ' ') $($Arguments -join ' ')"
    return
  }

  & npx @CliPrefix @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "playwright-cli failed: $($Arguments -join ' ')"
  }
}

function Wait-ForUrl {
  param([string]$TargetUrl)

  if ($DryRun) {
    Write-Host "wait for $TargetUrl"
    return
  }

  for ($i = 0; $i -lt 30; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $TargetUrl -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "Cannot reach $TargetUrl. Start the frontend server before recording."
}

function Write-Step {
  param(
    [string]$Name,
    [string]$Code
  )

  $path = Join-Path $StepsDir $Name
  Set-Content -LiteralPath $path -Value $Code -Encoding utf8
  return $path
}

New-Item -ItemType Directory -Force -Path $OutputDir, $StepsDir | Out-Null

$OutputPath = if ([System.IO.Path]::IsPathRooted($Output)) {
  $Output
} else {
  Join-Path $ProjectRoot $Output
}

$openingStep = Write-Step "01-reset-and-frame.js" @'
async (page) => {
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
}
'@

$wrongAnswerStep = Write-Step "02-wrong-answer.js" @'
async (page) => {
  await page.getByRole("button", { name: /Demo：學生選錯答案 B/ }).click();
  await page.waitForTimeout(1800);
}
'@

$jumpConceptStep = Write-Step "03-jump-concept.js" @'
async (page) => {
  await page.getByRole("button", { name: /跳到對應觀念/ }).first().click();
  await page.waitForTimeout(2400);
}
'@

$addPeerNoteStep = Write-Step "04-add-peer-note.js" @'
async (page) => {
  await page.getByRole("button", { name: /新增到共筆/ }).click();
  await page.waitForTimeout(1200);
}
'@

$nextStudentStep = Write-Step "05-next-student-peer-note.js" @'
async (page) => {
  await page.getByText("共筆").first().hover();
  await page.waitForTimeout(2000);
}
'@

Write-Host "Recording adaptive textbook demo from $Url"
Wait-ForUrl $Url

Invoke-PwCli close-all
Invoke-PwCli open $Url
Invoke-PwCli resize 1440 1100
Invoke-PwCli video-hide-actions
Invoke-PwCli run-code --filename $openingStep
Invoke-PwCli screenshot --filename (Join-Path $OutputDir "01-read-chapter-quiz.png") --full-page
Invoke-PwCli video-start $OutputPath
Invoke-PwCli video-chapter "Student finished reading and starts quiz"

Invoke-PwCli run-code --filename $wrongAnswerStep
Invoke-PwCli screenshot --filename (Join-Path $OutputDir "02-wrong-answer-explanation.png") --full-page
Invoke-PwCli video-chapter "Wrong answer explanation and concept link"

Invoke-PwCli run-code --filename $jumpConceptStep
Invoke-PwCli screenshot --filename (Join-Path $OutputDir "03-ai-remediation.png") --full-page
Invoke-PwCli video-chapter "AI highlights concept and modifies textbook"

Invoke-PwCli run-code --filename $addPeerNoteStep
Invoke-PwCli screenshot --filename (Join-Path $OutputDir "04-add-peer-note.png") --full-page
Invoke-PwCli video-chapter "Student adds reflection to peer notes"

Invoke-PwCli run-code --filename $nextStudentStep
Invoke-PwCli screenshot --filename (Join-Path $OutputDir "05-next-student-peer-notes.png") --full-page
Invoke-PwCli video-chapter "Next student reads peer notes"

Invoke-PwCli video-stop
Invoke-PwCli close

Write-Host "Demo video saved to $OutputPath"
