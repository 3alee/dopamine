import { Injectable } from '@angular/core';
import { FanartApi } from '../../common/api/fanart/fanart.api';
import { LastfmApi } from '../../common/api/lastfm/lastfm.api';
import { LastfmArtist } from '../../common/api/lastfm/lastfm-artist';
import { Logger } from '../../common/logger';
import { StringUtils } from '../../common/utils/string-utils';
import { TrackModel } from '../track/track-model';
import { ArtistInformation } from './artist-information';
import { ArtistInformationFactory } from './artist-information-factory';
import { TranslatorServiceBase } from '../translator/translator.service.base';
import { ArtistInformationServiceBase } from './artist-information.service.base';

@Injectable()
export class ArtistInformationService implements ArtistInformationServiceBase {
    public constructor(
        private translatorService: TranslatorServiceBase,
        private artistInformationFactory: ArtistInformationFactory,
        private lastfmApi: LastfmApi,
        private fanartApi: FanartApi,
        private logger: Logger,
    ) {}

    public async getArtistInformationAsync(track: TrackModel | undefined): Promise<ArtistInformation> {
        let artistInformation: ArtistInformation = ArtistInformation.empty();

        if (track == undefined) {
            return artistInformation;
        }

        if (StringUtils.isNullOrWhiteSpace(track.rawFirstArtist)) {
            return artistInformation;
        }

        let lastfmArtist: LastfmArtist | undefined;

        try {
            lastfmArtist = await this.lastfmApi.getArtistInfoAsync(track.rawFirstArtist, true, this.translatorService.get('language-code'));

            if (
                lastfmArtist == undefined ||
                lastfmArtist.biography == undefined ||
                StringUtils.isNullOrWhiteSpace(lastfmArtist.biography.content)
            ) {
                // In case there is no localized Biography, get the English one.
                lastfmArtist = await this.lastfmApi.getArtistInfoAsync(track.rawFirstArtist, true, 'EN');
            }
        } catch (e: unknown) {
            this.logger.error(e, 'Could not get lastfmArtist', 'ArtistInformationService', 'getArtistInformationAsync');
        }

        if (lastfmArtist == undefined) {
            return artistInformation;
        }

        let artistImageUrl: string = '';

        try {
            // Last.fm was so nice to break their artist image API. So we need to get images from elsewhere.
            artistImageUrl = await this.fanartApi.getArtistThumbnailAsync(lastfmArtist.musicBrainzId);
        } catch (e: unknown) {
            this.logger.error(e, 'Could not get artistImageUrl', 'ArtistInformationService', 'getArtistInformationAsync');
        }

        let biography: string = '';

        if (lastfmArtist.biography != undefined && !StringUtils.isNullOrWhiteSpace(lastfmArtist.biography.content)) {
            biography = this.removeUrlAndConvertLineBreaks(lastfmArtist.biography.content);
        }

        artistInformation = this.artistInformationFactory.create(lastfmArtist.name, lastfmArtist.url, artistImageUrl, biography);

        // Similar artists
        if (lastfmArtist.similarArtists != undefined && lastfmArtist.similarArtists.length > 0) {
            for (const similarArtist of lastfmArtist.similarArtists) {
                try {
                    const lastfmArtist: LastfmArtist = await this.lastfmApi.getArtistInfoAsync(similarArtist.name, true, 'EN');

                    // Last.fm was so nice to break their artist image API. So we need to get images from elsewhere.
                    const artistImageUrl: string = await this.fanartApi.getArtistThumbnailAsync(lastfmArtist.musicBrainzId);
                    artistInformation.addSimilarArtist(lastfmArtist.name, lastfmArtist.url, artistImageUrl);
                } catch (e: unknown) {
                    this.logger.error(
                        e,
                        `Could not get info for similar artist '${similarArtist.name}'`,
                        'ArtistInformationService',
                        'getArtistInformationAsync',
                    );
                }
            }
        }

        return artistInformation;
    }

    private removeUrlAndConvertLineBreaks(biography: string): string {
        // Removes the URL from the Biography content and converts line breaks to html breaks
        return biography
            .replace(/(<a.*$)/, '')
            .replace(/\n/g, '<br/>')
            .trim();
    }
}
