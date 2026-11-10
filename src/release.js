export const releaseKey='afterglow:last-seen-release';
export const validVersion=value=>typeof value==='string'&&/^\d+\.\d+\.\d+(?:-[\da-z.-]+)?$/i.test(value);
export function releaseStatus(current,remote,previous){if(!validVersion(current))return null;if(validVersion(remote)&&remote!==current)return {kind:'available',version:remote,message:`새 버전 v${remote}가 나왔어요. 새로고침하면 적용됩니다.`};if(validVersion(previous)&&previous!==current)return {kind:'changed',version:current,message:`v${current}로 업데이트됐어요. 현재 버전으로 플레이 중입니다.`};return null;}
export async function fetchRelease(fetcher=fetch){try{const r=await fetcher('./release.json',{cache:'no-store'});if(!r.ok)return null;const data=await r.json();return validVersion(data.version)?data.version:null;}catch{return null;}}
