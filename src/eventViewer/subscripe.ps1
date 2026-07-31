$query = @"
<QueryList>
  <Query Id="0" Path="Application">
    <Select Path="Application">*</Select>
  </Query>
</QueryList>
"@

Register-WinEvent -Query $query -SourceIdentifier AppEvents

while ($true) {
    $event = Wait-Event -SourceIdentifier AppEvents

    $record = $event.SourceEventArgs.NewEvent

    $obj = @{
        Id = $record.Id
        Provider = $record.ProviderName
        Level = $record.LevelDisplayName
        Time = $record.TimeCreated
        Message = $record.FormatDescription()
    }

    $obj | ConvertTo-Json -Compress

    Remove-Event -EventIdentifier $event.EventIdentifier
}