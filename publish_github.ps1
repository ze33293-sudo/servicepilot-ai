param(
    [string]$RepositoryName = "servicepilot-ai",
    [string]$ReleaseTag = "v1.0.0",
    [string]$VideoAsset = ".\video\out\servicepilot-ai-demo-final.mp4"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = (Get-Location).Path.Replace("\", "/")
$safeDirectoryArgument = "safe.directory=$repositoryRoot"

function Get-GitHubCredential {
    $credentialInput = "protocol=https`nhost=github.com`n`n"
    $credentialLines = $credentialInput | git credential fill
    if ($LASTEXITCODE -ne 0) {
        throw "Git Credential Manager did not return a GitHub credential. Run: git credential-manager github login"
    }

    $credential = @{}
    foreach ($line in $credentialLines) {
        $pair = $line -split "=", 2
        if ($pair.Count -eq 2) {
            $credential[$pair[0]] = $pair[1]
        }
    }

    if (-not $credential.password) {
        throw "GitHub OAuth token was not found. Complete browser authorization first."
    }
    return $credential
}

$credential = Get-GitHubCredential
$headers = @{
    Accept = "application/vnd.github+json"
    Authorization = "Bearer $($credential.password)"
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent" = "ServicePilot-AI-Publisher"
}

$user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
$owner = $user.login
$repositoryUri = "https://api.github.com/repos/$owner/$RepositoryName"

try {
    $repository = Invoke-RestMethod -Uri $repositoryUri -Headers $headers
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) {
        throw
    }
    $body = @{
        name = $RepositoryName
        description = "Local-first enterprise support ticket agent with grounded RAG, tool use, evaluation, and ROI."
        private = $false
        has_issues = $true
        has_projects = $false
        has_wiki = $false
    } | ConvertTo-Json
    $repository = Invoke-RestMethod -Method Post -Uri "https://api.github.com/user/repos" -Headers $headers -Body $body -ContentType "application/json"
}

$expectedRemote = $repository.clone_url
$remotes = @(git -c $safeDirectoryArgument remote)
if ($remotes -notcontains "origin") {
    git -c $safeDirectoryArgument remote add origin $expectedRemote
} else {
    $currentRemote = git -c $safeDirectoryArgument remote get-url origin
    if ($currentRemote -ne $expectedRemote) {
        throw "origin points to $currentRemote; expected $expectedRemote."
    }
}

git -c $safeDirectoryArgument push -u origin main
if ($LASTEXITCODE -ne 0) {
    throw "Git push failed."
}

if (-not (Test-Path -LiteralPath $VideoAsset)) {
    throw "Final video was not found: $VideoAsset"
}

$releases = Invoke-RestMethod -Uri "$repositoryUri/releases" -Headers $headers
$release = $releases | Where-Object { $_.tag_name -eq $ReleaseTag } | Select-Object -First 1
if (-not $release) {
    $releaseBody = @{
        tag_name = $ReleaseTag
        target_commitish = "main"
        name = "ServicePilot AI v1.0.0"
        body = "180-second Chinese product demo. All customers, orders, policies, evaluation cases, and ROI figures are fictional demonstration data."
        draft = $false
        prerelease = $false
    } | ConvertTo-Json
    $release = Invoke-RestMethod -Method Post -Uri "$repositoryUri/releases" -Headers $headers -Body $releaseBody -ContentType "application/json"
}

$assetName = Split-Path -Leaf $VideoAsset
$existingAsset = $release.assets | Where-Object { $_.name -eq $assetName } | Select-Object -First 1
if (-not $existingAsset) {
    $uploadBase = $release.upload_url -replace "\{\?name,label\}$", ""
    $encodedName = [uri]::EscapeDataString($assetName)
    Invoke-RestMethod -Method Post -Uri "${uploadBase}?name=$encodedName" -Headers $headers -InFile $VideoAsset -ContentType "video/mp4" | Out-Null
}

Write-Output "Repository: $($repository.html_url)"
Write-Output "Release: $($release.html_url)"
