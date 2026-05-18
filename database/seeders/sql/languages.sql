-- -------------------------------------------------------------
-- TablePlus 5.5.2(512)
--
-- https://tableplus.com/
--
-- Database: local
-- Generation Time: 2023-10-20 20:59:15.0420
-- -------------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;



INSERT INTO `languages` (`id`, `code`, `english_name`, `major`, `active`, `default_locale`, `tag`, `encode_url`, `country`) VALUES
(1, 'EN', 'English', 1, 1, 'en_US', 'en', 0, NULL),
(2, 'ES', 'Spanish', 1, 0, 'es_ES', 'es', 0, NULL),
(3, 'DE', 'German', 1, 0, 'de_DE', 'de', 0, NULL),
(4, 'FR', 'French', 1, 0, 'fr_FR', 'fr', 0, NULL),
(5, 'AR', 'Arabic', 0, 0, 'ar', 'ar', 0, NULL),
(6, 'BS', 'Bosnian', 0, 0, 'bs_BA', 'bs', 0, NULL),
(7, 'BG', 'Bulgarian', 0, 0, 'bg_BG', 'bg', 0, NULL),
(8, 'CA', 'Catalan', 0, 0, 'ca', 'ca', 0, NULL),
(9, 'CS', 'Czech', 0, 0, 'cs_CZ', 'cs', 0, NULL),
(10, 'SK', 'Slovak', 0, 0, 'sk_SK', 'sk', 0, NULL),
(11, 'CY', 'Welsh', 0, 0, 'cy_GB', 'cy', 0, NULL),
(12, 'DA', 'Danish', 1, 0, 'da_DK', 'da', 0, NULL),
(13, 'EL', 'Greek', 0, 0, 'el', 'el', 0, NULL),
(14, 'EO', 'Esperanto', 0, 0, 'eo_UY', 'eo', 0, NULL),
(15, 'ET', 'Estonian', 0, 0, 'et', 'et', 0, NULL),
(16, 'EU', 'Basque', 0, 0, 'eu_ES', 'eu', 0, NULL),
(17, 'FA', 'Persian', 0, 0, 'fa_IR', 'fa', 0, NULL),
(18, 'FI', 'Finnish', 0, 0, 'fi', 'fi', 0, NULL),
(19, 'GA', 'Irish', 0, 0, 'ga_IE', 'ga', 0, NULL),
(20, 'HE', 'Hebrew', 0, 0, 'he_IL', 'he', 0, NULL),
(21, 'HI', 'Hindi', 0, 0, 'hi_IN', 'hi', 0, NULL),
(22, 'HR', 'Croatian', 0, 0, 'hr', 'hr', 0, NULL),
(23, 'HU', 'Hungarian', 0, 0, 'hu_HU', 'hu', 0, NULL),
(24, 'HY', 'Armenian', 0, 0, 'hy_AM', 'hy', 0, NULL),
(25, 'ID', 'Indonesian', 0, 1, 'id_ID', 'id', 0, NULL),
(26, 'IS', 'Icelandic', 0, 0, 'is_IS', 'is', 0, NULL),
(27, 'IT', 'Italian', 1, 0, 'it_IT', 'it', 0, NULL),
(28, 'JA', 'Japanese', 1, 0, 'ja', 'ja', 0, NULL),
(29, 'KO', 'Korean', 0, 0, 'ko_KR', 'ko', 0, NULL),
(30, 'KU', 'Kurdish', 0, 0, 'ckb', 'ku', 0, NULL),
(31, 'LV', 'Latvian', 0, 0, 'lv_LV', 'lv', 0, NULL),
(32, 'LT', 'Lithuanian', 0, 0, 'lt_LT', 'lt', 0, NULL),
(33, 'MK', 'Macedonian', 0, 0, 'mk_MK', 'mk', 0, NULL),
(34, 'MT', 'Maltese', 0, 0, 'mt_MT', 'mt', 0, NULL),
(35, 'MN', 'Mongolian', 0, 0, 'mn_MN', 'mn', 0, NULL),
(36, 'NE', 'Nepali', 0, 0, 'ne', 'ne', 0, NULL),
(37, 'NL', 'Dutch', 1, 0, 'nl_NL', 'nl', 0, NULL),
(38, 'NO', 'Norwegian Bokmål', 0, 0, 'nb_NO', 'no', 0, NULL),
(39, 'PA', 'Punjabi', 0, 0, 'pa_IN', 'pa', 0, NULL),
(40, 'PL', 'Polish', 0, 0, 'pl_PL', 'pl', 0, NULL),
(41, 'PT-PT', 'Portuguese, Portugal', 0, 0, 'pt_PT', 'pt-pt', 0, NULL),
(42, 'PT-BR', 'Portuguese, Brazil', 0, 0, 'pt_BR', 'pt-br', 0, NULL),
(43, 'QU', 'Quechua', 0, 0, 'quz_PE', 'qu', 0, NULL),
(44, 'RO', 'Romanian', 0, 0, 'ro_RO', 'ro', 0, NULL),
(45, 'RU', 'Russian', 1, 0, 'ru_RU', 'ru', 0, NULL),
(46, 'SL', 'Slovenian', 0, 0, 'sl_SI', 'sl', 0, NULL),
(47, 'SO', 'Somali', 0, 0, 'so_SO', 'so', 0, NULL),
(48, 'SQ', 'Albanian', 0, 0, 'sq_AL', 'sq', 0, NULL),
(49, 'SR', 'Serbian', 0, 0, 'sr_RS', 'sr', 0, NULL),
(50, 'SV', 'Swedish', 0, 0, 'sv_SE', 'sv', 0, NULL),
(51, 'TA', 'Tamil', 0, 0, 'ta_IN', 'ta', 0, NULL),
(52, 'TH', 'Thai', 0, 0, 'th', 'th', 0, NULL),
(53, 'TR', 'Turkish', 0, 0, 'tr_TR', 'tr', 0, NULL),
(54, 'UK', 'Ukrainian', 0, 0, 'uk', 'uk', 0, NULL),
(55, 'UR', 'Urdu', 0, 0, 'ur', 'ur', 0, NULL),
(56, 'UZ', 'Uzbek', 0, 0, 'uz_UZ', 'uz', 0, NULL),
(57, 'VI', 'Vietnamese', 0, 0, 'vi_VN', 'vi', 0, NULL),
(58, 'YI', 'Yiddish', 0, 0, '', 'yi', 0, NULL),
(59, 'ZH-HANS', 'Chinese (Simplified)', 1, 0, 'zh_CN', 'zh-hans', 0, NULL),
(60, 'ZU', 'Zulu', 0, 0, '', 'zu', 0, NULL),
(61, 'ZH-hant', 'Chinese (Traditional)', 1, 0, 'zh_TW', 'zh-hant', 0, NULL),
(62, 'MS', 'Malay', 0, 0, 'ms_MY', 'ms', 0, NULL),
(63, 'GL', 'Galician', 0, 0, 'gl_ES', 'gl', 0, NULL),
(64, 'BN', 'Bengali', 0, 0, 'bn_BD', 'bn', 0, NULL),
(65, 'AZ', 'Azerbaijani', 0, 0, 'az', 'az', 0, NULL);


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;