#ifdef GL_ES
precision mediump float;
#endif

// Phong related variables
uniform sampler2D uSampler;
uniform vec3 uKd;
uniform vec3 uKs;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform vec3 uLightIntensity;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

// Shadow map related variables
#define NUM_SAMPLES 20
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES
#define NUM_RINGS 10

#define SHADOW_MAP_SIZE 2048.
#define FRUSTUM_SIZE 400.

#define NEAR_PLANE .01
#define LIGHT_WORLD_SIZE 5.
#define LIGHT_SIZE_UV LIGHT_WORLD_SIZE/FRUSTUM_SIZE

#define EPS 1e-3
#define PI 3.141592653589793
#define PI2 6.283185307179586

uniform sampler2D uShadowMap;

varying vec4 vPositionFromLight;

highp float rand_1to1(highp float x ) { 
  // -1 -1
  return fract(sin(x)*10000.0);
}

highp float rand_2to1(vec2 uv ) { 
  // 0 - 1
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

float unpack(vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    return dot(rgbaDepth, bitShift);
}

vec2 poissonDisk[NUM_SAMPLES];

void poissonDiskSamples( const in vec2 randomSeed ) {

  float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
  float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

  float angle = rand_2to1( randomSeed ) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

void uniformDiskSamples( const in vec2 randomSeed ) {

  float randNum = rand_2to1(randomSeed);
  float sampleX = rand_1to1( randNum ) ;
  float sampleY = rand_1to1( sampleX ) ;

  float angle = sampleX * PI2;
  float radius = sqrt(sampleY);

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( radius * cos(angle) , radius * sin(angle)  );

    sampleX = rand_1to1( sampleY ) ;
    sampleY = rand_1to1( sampleX ) ;

    angle = sampleX * PI2;
    radius = sqrt(sampleY);
  }
}

float findBlocker( sampler2D shadowMap,  vec2 uv, float zReceiver ) {
  int blockerNum = 0;
  float blockerDepth = 0.0;
  
  float posZFromLight = vPositionFromLight.z;
  float seachRadius = LIGHT_SIZE_UV * (posZFromLight - NEAR_PLANE) /posZFromLight;
  
  poissonDiskSamples(uv);
  for(int i =0; i< BLOCKER_SEARCH_NUM_SAMPLES; i++){
    float shadowDepth = unpack(texture2D(shadowMap, uv + poissonDisk[i] * seachRadius));
    if(zReceiver > shadowDepth){
      blockerDepth +=shadowDepth;
      blockerNum++;
    }
  }
  if(blockerNum == 0)
    return -1.0;
  return blockerDepth / float(blockerNum);
}


float getShadowBias(float c,float filterRadiusUV){
  vec3 normal=normalize(vNormal);
  vec3 lightDir=normalize(uLightPos-vFragPos);
  float fragSize=(1.+ceil(filterRadiusUV))*(FRUSTUM_SIZE/SHADOW_MAP_SIZE/2.);
  return max(fragSize,fragSize*(1.-dot(normal,lightDir)))*c;
}


float useShadowMap(sampler2D shadowMap, vec4 shadowCoord, float biasC, float filterRadiusUV){
  // 查询当前着色点在 ShadowMap 中的深度值
  vec4 rgbaDepth = texture2D(shadowMap, shadowCoord.xy);
  float shadowDepth = unpack(rgbaDepth);
  // 计算当前着色点的深度值
  float currentDepth = shadowCoord.z;
  float bias = getShadowBias(biasC, filterRadiusUV);
  if(currentDepth - bias >= shadowDepth + EPS)  return 0.0;
  // if(currentDepth >= shadowDepth + bias) return 0.0;
  return 1.;
}

float PCF(sampler2D shadowMap, vec4 coords, float biasC, float filterRadiusUV){
  
  // 单位圆盘（或者正方形）上采样的随机偏移量
  poissonDiskSamples(coords.xy);
  
  float visibility=0.;
  for(int i=0;i<PCF_NUM_SAMPLES;i++){
    visibility+=useShadowMap(shadowMap, coords + vec4(poissonDisk[i] * filterRadiusUV,0.,0.), biasC, filterRadiusUV);
  }
  visibility/=float(PCF_NUM_SAMPLES);
  return visibility;
}

float PCSS(sampler2D shadowMap, vec4 coords, float biasC){
  
  // STEP 1: avgblocker depth
  float avgBlockerDepth = findBlocker(shadowMap, coords.xy, coords.z);

  // if no blocker found, return 1.0
  if(avgBlockerDepth < -EPS) 
    return 1.0;

  // STEP 2: penumbra size
  float penumbra = (coords.z - avgBlockerDepth) / avgBlockerDepth * float(LIGHT_SIZE_UV);
  // 限制 penumbra 的范围在 [0,1] 之间，否则会出现不必要的阴影
  penumbra = clamp(penumbra, 0.0, 1.0);

  // STEP 3: filtering
  return PCF(shadowMap, coords, biasC, penumbra);  
}


vec3 blinnPhong() {
  vec3 color = texture2D(uSampler, vTextureCoord).rgb;
  color = pow(color, vec3(2.2));

  vec3 ambient = 0.05 * color;

  vec3 lightDir = normalize(uLightPos);
  vec3 normal = normalize(vNormal);
  float diff = max(dot(lightDir, normal), 0.0);
  vec3 light_atten_coff =
      uLightIntensity / pow(length(uLightPos - vFragPos), 2.0);
  vec3 diffuse = diff * light_atten_coff * color;

  vec3 viewDir = normalize(uCameraPos - vFragPos);
  vec3 halfDir = normalize((lightDir + viewDir));
  float spec = pow(max(dot(halfDir, normal), 0.0), 32.0);
  vec3 specular = uKs * light_atten_coff * spec;

  vec3 radiance = (ambient + diffuse + specular);
  vec3 phongColor = pow(radiance, vec3(1.0 / 2.2));
  return phongColor;
}

void main(void) {

  float visibility;
  // vPositionFromLight是裁剪坐标，需要除以w分量 （由于不是 gl_Position,不会被自动处理），从而转换成 NDC 坐标
  vec3 shadowCoord = vPositionFromLight.xyz / vPositionFromLight.w;
  // 由于shadowCoord是 NDC 坐标 ，在[-1,1]范围，需要转换到[0,1]范围，从而可以在 shadow map 纹理中查找
  shadowCoord.xyz = shadowCoord.xyz * 0.5 + 0.5;
  float bias = 0.2;
  // 阴影贴图中采样的过滤半径
  float filterRadiusUV = float(NUM_RINGS) / SHADOW_MAP_SIZE;

  // visibility = useShadowMap(uShadowMap, vec4(shadowCoord, 1.0), bias, 0.);
  // visibility = PCF(uShadowMap, vec4(shadowCoord, 1.0), bias, filterRadiusUV);
  visibility = PCSS(uShadowMap, vec4(shadowCoord, 1.0), bias);

  vec3 phongColor = blinnPhong();

  gl_FragColor = vec4(phongColor * visibility, 1.0);
  // gl_FragColor = vec4(phongColor, 1.0);
}