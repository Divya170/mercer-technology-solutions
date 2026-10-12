import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MinLength(2, { message: 'Enter the company name.' }) @MaxLength(120) companyName?: string;
  @IsOptional() @IsString() @MaxLength(120) contactName?: string;

  @IsOptional()
  @ValidateIf((o: UpdateSettingsDto) => o.email !== null && o.email !== '')
  @IsEmail({}, { message: 'Enter a valid email address, like name@company.com.' })
  @MaxLength(254)
  email?: string | null;

  @IsOptional()
  @ValidateIf((o: UpdateSettingsDto) => o.phone !== null && o.phone !== '')
  @Matches(/^[0-9+()\-.\s]{7,30}$/, { message: 'Enter a valid phone number.' })
  phone?: string | null;

  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine1 !== null) @IsString() @MaxLength(160) addressLine1?: string | null;
  @IsOptional() @ValidateIf((o: UpdateSettingsDto) => o.addressLine2 !== null) @IsString() @MaxLength(160) addressLine2?: string | null;
  @IsOptional() @IsString() @MaxLength(80) locationTag?: string;
  @IsOptional() @IsString() @MaxLength(600) companyStatement?: string;
  @IsOptional() @IsString() @MaxLength(6000) companyOverview?: string;
  @IsOptional() @IsString() @MaxLength(200) companyFocus?: string;
  @IsOptional() @IsString() @MaxLength(30000) privacyPolicy?: string;
  @IsOptional() @IsBoolean() showSamples?: boolean;
  @IsOptional() @IsBoolean() showBudget?: boolean;
  @IsOptional() @IsBoolean() enquiriesOpen?: boolean;
}
